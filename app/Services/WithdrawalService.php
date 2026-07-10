<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Gate;
use App\Models\Withdrawal;
use RuntimeException;

class WithdrawalService
{
    private const ETH_DECIMALS = 18;

    private const NATIVE_GAS_LIMIT = 21000;

    private const ERC20_GAS_LIMIT = 100000;

    public function __construct(
        private readonly WalletService $walletService,
        private readonly EthereumRpcService $rpc,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function createAndBroadcast(
        string $assetGateName,
        string $fromAddress,
        string $toAddress,
        string $amount,
    ): array {
        $assetGate = Gate::query()->where('name', $assetGateName)->firstOrFail();
        $baseGate = $this->resolveBaseGate($assetGate);
        $fromWallet = $this->resolveFromWallet($baseGate, $fromAddress);

        if (! $this->walletService->verifyAddress($toAddress, $baseGate->type)) {
            throw new RuntimeException('Invalid recipient address');
        }

        $decimals = $this->resolveDecimals($assetGate);
        $amountBaseUnits = $this->amountToBaseUnits($amount, $decimals);

        $withdrawal = Withdrawal::query()->create([
            'asset_gate_id' => $assetGate->id,
            'to_address' => $toAddress,
            'amount' => $amount,
            'amount_base_units' => $amountBaseUnits,
            'status' => Withdrawal::STATUS_CREATED,
        ]);

        try {
            $txParams = $this->buildTxParams($assetGate, $baseGate, $fromWallet, $toAddress, $amountBaseUnits);
            $signed = $this->walletService->createSignedTransaction(
                $fromWallet->account,
                $fromWallet->change,
                $fromWallet->address_index,
                $txParams,
            );

            $broadcastHash = $this->rpc->sendRawTransaction($baseGate->rpc_url, $signed['signed_tx']);

            $withdrawal->update([
                'tx_hash' => $broadcastHash,
                'signed_tx' => $signed['signed_tx'],
                'status' => Withdrawal::STATUS_BROADCASTED,
            ]);
        } catch (\Throwable $exception) {
            $withdrawal->update([
                'status' => Withdrawal::STATUS_FAILED,
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        return [
            'id' => $withdrawal->id,
            'asset_gate' => $assetGate->name,
            'amount' => $withdrawal->amount,
            'amount_base_units' => $withdrawal->amount_base_units,
            'status' => $withdrawal->status,
            'tx_hash' => $withdrawal->tx_hash,
        ];
    }

    private function resolveBaseGate(Gate $assetGate): Gate
    {
        if ($assetGate->parent_gate_id === null) {
            return $assetGate;
        }

        $baseGate = $assetGate->parentGate;

        if ($baseGate === null || $baseGate->rpc_url === null) {
            throw new RuntimeException('Base gate RPC is not configured');
        }

        return $baseGate;
    }

    private function resolveDecimals(Gate $assetGate): int
    {
        if ($assetGate->asset_type === 'NATIVE') {
            return self::ETH_DECIMALS;
        }

        if ($assetGate->token_decimals === null) {
            throw new RuntimeException('Token decimals are not configured');
        }

        return (int) $assetGate->token_decimals;
    }

    private function amountToBaseUnits(string $amount, int $decimals): string
    {
        if (! str_contains($amount, '.')) {
            return bcmul($amount, bcpow('10', (string) $decimals, 0), 0);
        }

        [$whole, $fraction] = explode('.', $amount, 2);
        $fraction = substr(str_pad($fraction, $decimals, '0', STR_PAD_RIGHT), 0, $decimals);

        $wholeUnits = bcmul($whole === '' ? '0' : $whole, bcpow('10', (string) $decimals, 0), 0);

        return bcadd($wholeUnits, $fraction, 0);
    }

    private function buildTxParams(
        Gate $assetGate,
        Gate $baseGate,
        Address $fromWallet,
        string $toAddress,
        string $amountBaseUnits,
    ): array {
        $nonce = $this->rpc->getTransactionCount($baseGate->rpc_url, $fromWallet->address);
        $gasPriceWei = $this->rpc->getGasPriceWei($baseGate->rpc_url);
        $maxPriorityFee = bcdiv($gasPriceWei, '2', 0);
        $balance = (string) ($fromWallet->balance ?? '0');

        if ($assetGate->asset_type === 'NATIVE') {
            $gasFee = bcmul((string) self::NATIVE_GAS_LIMIT, $gasPriceWei, 0);
            $this->assertSufficientBalance($balance, bcadd($amountBaseUnits, $gasFee, 0));

            return [
                'to' => $toAddress,
                'value_wei' => $amountBaseUnits,
                'data' => '0x',
                'nonce' => $nonce,
                'chain_id' => (int) $baseGate->chain_id,
                'gas_limit' => self::NATIVE_GAS_LIMIT,
                'max_fee_per_gas_wei' => $gasPriceWei,
                'max_priority_fee_per_gas_wei' => $maxPriorityFee,
            ];
        }

        if ($assetGate->token_contract === null) {
            throw new RuntimeException('Token contract is not configured');
        }

        // ERC-20 transfer spends gas from the native balance and tokens from the contract balance.
        $gasFee = bcmul((string) self::ERC20_GAS_LIMIT, $gasPriceWei, 0);
        $this->assertSufficientBalance($balance, $gasFee);

        $tokenBalance = $this->rpc->getErc20Balance(
            $baseGate->rpc_url,
            $assetGate->token_contract,
            $fromWallet->address,
        );
        if (bccomp($tokenBalance, $amountBaseUnits, 0) < 0) {
            throw new RuntimeException('Insufficient token balance');
        }

        return [
            'to' => $assetGate->token_contract,
            'value_wei' => '0',
            'data' => $this->encodeErc20Transfer($toAddress, $amountBaseUnits),
            'nonce' => $nonce,
            'chain_id' => (int) $baseGate->chain_id,
            'gas_limit' => self::ERC20_GAS_LIMIT,
            'max_fee_per_gas_wei' => $gasPriceWei,
            'max_priority_fee_per_gas_wei' => $maxPriorityFee,
        ];
    }

    private function assertSufficientBalance(string $balance, string $required): void
    {
        if (bccomp($balance, $required, 0) < 0) {
            throw new RuntimeException('Insufficient balance');
        }
    }

    private function resolveFromWallet(Gate $baseGate, string $fromAddress): Address
    {
        $fromWallet = Address::query()
            ->where('gate_id', $baseGate->id)
            ->whereRaw('LOWER(address) = ?', [strtolower($fromAddress)])
            ->first();

        if ($fromWallet === null) {
            throw new RuntimeException('From address not found');
        }

        return $fromWallet;
    }

    private function encodeErc20Transfer(string $toAddress, string $amountBaseUnits): string
    {
        $selector = 'a9059cbb';
        $addressHex = strtolower(ltrim($toAddress, '0x'));
        $paddedAddress = str_pad($addressHex, 64, '0', STR_PAD_LEFT);
        $paddedAmount = str_pad($this->decimalToHex($amountBaseUnits), 64, '0', STR_PAD_LEFT);

        return '0x'.$selector.$paddedAddress.$paddedAmount;
    }

    private function decimalToHex(string $decimal): string
    {
        if ($decimal === '0') {
            return '0';
        }

        $hex = '';
        $value = $decimal;

        while (bccomp($value, '0') > 0) {
            $remainder = (int) bcmod($value, '16');
            $hex = dechex($remainder).$hex;
            $value = bcdiv($value, '16', 0);
        }

        return $hex;
    }
}
