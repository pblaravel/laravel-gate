<?php

namespace App\Console\Commands;

use App\Models\Address;
use App\Models\Deposit;
use App\Models\Gate;
use App\Models\IndexedBlock;
use App\Services\EthereumRpcService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('blockchain:index {--base_gate= : Base gate name} {--start_block= : Start block}')]
#[Description('Index incoming native and ERC-20 deposits for a base gate')]
class BlockchainIndex extends Command
{
    private const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    public function __construct(
        private readonly EthereumRpcService $rpc,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $baseGateName = $this->option('base_gate');

        if (! $baseGateName) {
            $this->error('Option --base_gate is required');

            return self::FAILURE;
        }

        $baseGate = Gate::query()
            ->where('name', $baseGateName)
            ->whereNull('parent_gate_id')
            ->first();

        if (! $baseGate) {
            $this->error("Base gate {$baseGateName} not found");

            return self::FAILURE;
        }

        if (! $baseGate->rpc_url) {
            $this->error("RPC URL is not configured for gate {$baseGateName}");

            return self::FAILURE;
        }

        $latestBlock = $this->rpc->getBlockNumber($baseGate->rpc_url); // 11237045; 
        $startBlock = $this->option('start_block') ?: max(0, $latestBlock - 1);

        $this->info("Indexing blocks {$startBlock}..{$latestBlock} for {$baseGateName}");

        $depositsCreated = 0;
        $blockNumber = $startBlock;

        while ($blockNumber <= $latestBlock) {
            $block = $this->rpc->getBlockByNumber($baseGate->rpc_url, $blockNumber, true);
            $this->info("Indexing block {$blockNumber} for {$baseGateName}");
            if ($blockNumber > 0 && ! $this->validateParentHash($baseGate->id, $blockNumber, $block['parentHash'])) {
                $this->warn("Reorg detected at block {$blockNumber}, rolling back");
                $this->rollbackFromBlock($baseGate->id, $blockNumber);
                $blockNumber = max(0, $blockNumber - 1);

                continue;
            }

            $depositsCreated += $this->indexNativeDeposits(
                $baseGate,
                $block,
                $blockNumber,
            );
            

            $depositsCreated += $this->indexErc20Deposits(
                $baseGate,
                $block,
                $blockNumber,
            );

            IndexedBlock::query()->updateOrCreate(
                [
                    'base_gate_id' => $baseGate->id,
                    'block_number' => $blockNumber,
                ],
                [
                    'block_hash' => $block['hash'],
                    'parent_hash' => $block['parentHash'],
                ],
            );

            $this->confirmDeposits($baseGate, $blockNumber);

            $blockNumber++;
        }

        $this->info("Done. Created {$depositsCreated} deposits. Last block: {$latestBlock}");

        return self::SUCCESS;
    }

    private function indexNativeDeposits(
        Gate $baseGate,
        array $block,
        int $blockNumber,
    ): int {
        $created = 0;

        foreach ($block['transactions'] as $transaction) {
            $toAddress = $this->normalizeAddress($transaction['to'] ?? '');
            $address = Address::where('gate_id', $baseGate->id)
                ->whereRaw('LOWER(address) = ?', [strtolower($toAddress)])
                ->first();
            if ($address === null) {
                continue;
            }

            $findDeposit = Deposit::where('address_id', $address->id)
                ->where('tx_hash', $transaction['hash'])
                ->where('log_index', 0)
                ->first();
            if ($findDeposit !== null) {
                continue;
            }

            $amount = $this->hexToDecimal($transaction['value'] ?? '0x0');

            DB::transaction(function () use ($baseGate, $address, $block, $blockNumber, $transaction, $toAddress, $amount, &$created): void {
                $lockedAddress = Address::whereKey($address->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                Deposit::create([
                    'asset_gate_id' => $baseGate->id,
                    'address_id' => $lockedAddress->id,
                    'tx_hash' => $transaction['hash'],
                    'log_index' => 0,
                    'block_number' => $blockNumber,
                    'block_hash' => $block['hash'],
                    'from_address' => $this->normalizeAddress($transaction['from'] ?? ''),
                    'to_address' => $toAddress,
                    'amount' => $amount,
                    'status' => 'CREATED',
                ]);

                $created++;
            });
        }

        return $created;
    }

    private function indexErc20Deposits(
        Gate $baseGate,
        array $block,
        int $blockNumber,
    ): int {
        $created = 0;

        $erc20Gates = Gate::query()
            ->where('parent_gate_id', $baseGate->id)
            ->where('asset_type', 'ERC20')
            ->whereNotNull('token_contract')
            ->get();

        if ($erc20Gates->isEmpty()) {
            return 0;
        }

        $contractToGate = [];
        foreach ($erc20Gates as $erc20Gate) {
            $contractToGate[strtolower($erc20Gate->token_contract)] = $erc20Gate;
        }

        $logs = $this->rpc->getLogs(
            $baseGate->rpc_url,
            $blockNumber,
            $blockNumber,
            array_keys($contractToGate),
        );

        foreach ($logs as $log) {
            if (($log['topics'][0] ?? '') !== self::TRANSFER_EVENT_TOPIC) {
                continue;
            }

            $erc20Gate = $contractToGate[strtolower($log['address'] ?? '')] ?? null;
            if ($erc20Gate === null) {
                continue;
            }

            $toAddress = $this->topicToAddress($log['topics'][2] ?? '');
            $fromAddress = $this->topicToAddress($log['topics'][1] ?? '');
            $this->info("Indexing ERC-20 deposit from {$fromAddress} to {$toAddress} for {$erc20Gate->name}");
            $address = Address::where('gate_id', $baseGate->id)
                ->whereRaw('LOWER(address) = ?', [strtolower($toAddress)])
                ->first();
            if ($address === null) {
                continue;
            }

            $logIndex = (int) hexdec((string) ($log['logIndex'] ?? '0x0'));

            $existingDeposit = Deposit::where('asset_gate_id', $erc20Gate->id)
                ->where('tx_hash', $log['transactionHash'])
                ->where('log_index', $logIndex)
                ->first();
            if ($existingDeposit !== null) {
                continue;
            }

            $amount = $this->hexToDecimal($log['data'] ?? '0x0');

            DB::transaction(function () use ($erc20Gate, $address, $block, $blockNumber, $log, $toAddress, $fromAddress, $logIndex, $amount, &$created): void {
                Deposit::create([
                    'asset_gate_id' => $erc20Gate->id,
                    'address_id' => $address->id,
                    'tx_hash' => $log['transactionHash'],
                    'log_index' => $logIndex,
                    'block_number' => $blockNumber,
                    'block_hash' => $block['hash'],
                    'from_address' => $fromAddress,
                    'to_address' => $toAddress,
                    'amount' => $amount,
                    'status' => 'CREATED',
                ]);

                $created++;
            });
        }

        return $created;
    }

    private function confirmDeposits(Gate $baseGate, int $blockNumber): void
    {
        $confirmationsRequired = $baseGate->confirmations_required;

        if ($blockNumber < $confirmationsRequired) {
            return;
        }

        $confirmedUpToBlock = $blockNumber - $confirmationsRequired;

        $assetGateIds = Gate::query()
            ->where('id', $baseGate->id)
            ->orWhere('parent_gate_id', $baseGate->id)
            ->pluck('id');

        $deposits = Deposit::query()
            ->whereIn('asset_gate_id', $assetGateIds)
            ->where('status', 'CREATED')
            ->where('block_number', '<=', $confirmedUpToBlock)
            ->get();

        foreach ($deposits as $deposit) {
            $deposit->update(['status' => 'CONFIRMED']);
            $deposit->address->update([
                'balance' => bcsub((string) ($deposit->address->balance ?? '0'), $deposit->amount, 0),
            ]);
        }
    }

    private function validateParentHash(int $baseGateId, int $blockNumber, string $parentHash): bool
    {
        $previousBlock = IndexedBlock::query()
            ->where('base_gate_id', $baseGateId)
            ->where('block_number', $blockNumber - 1)
            ->first();

        if (! $previousBlock) {
            return true;
        }

        return $this->normalizeAddress($previousBlock->block_hash)
            === $this->normalizeAddress($parentHash);
    }

    private function rollbackFromBlock(int $baseGateId, int $fromBlock): void
    {
        Deposit::query()
            ->where('block_number', '>=', $fromBlock)
            ->where('status', 'CREATED')
            ->update(['status' => 'REORGED']);

        IndexedBlock::query()
            ->where('base_gate_id', $baseGateId)
            ->where('block_number', '>=', $fromBlock)
            ->delete();
            
    }

    private function normalizeAddress(?string $address): string
    {
        if ($address === null || $address === '') {
            return '';
        }

        return strtolower($address);
    }

    private function topicToAddress(string $topic): string
    {
        $topic = strtolower(str_replace('0x', '', $topic));

        if (strlen($topic) < 40) {
            return '';
        }

        return '0x'.substr($topic, -40);
    }

    private function hexToDecimal(string $hex): string
    {
        $hex = strtolower(str_replace('0x', '', $hex));

        if ($hex === '' || $hex === '0') {
            return '0';
        }

        if (extension_loaded('gmp')) {
            return gmp_strval(gmp_init($hex, 16));
        }

        if (extension_loaded('bcmath')) {
            $decimal = '0';

            foreach (str_split($hex) as $char) {
                $decimal = bcmul($decimal, '16');
                $decimal = bcadd($decimal, (string) hexdec($char));
            }

            return $decimal;
        }

        return (string) hexdec($hex);
    }
}
