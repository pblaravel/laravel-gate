<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class EthereumRpcService
{
    public function call(string $rpcUrl, string $method, array $params = []): mixed
    {
        $response = Http::timeout(30)->post($rpcUrl, [
            'jsonrpc' => '2.0',
            'id' => 1,
            'method' => $method,
            'params' => $params,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException("RPC request failed: {$method}");
        }

        $payload = $response->json();

        if (isset($payload['error'])) {
            $message = $payload['error']['message'] ?? 'Unknown RPC error';
            throw new RuntimeException("RPC error ({$method}): {$message}");
        }

        return $payload['result'] ?? null;
    }

    public function getBlockNumber(string $rpcUrl): int
    {
        return (int) hexdec((string) $this->call($rpcUrl, 'eth_blockNumber'));
    }

    public function getBlockByNumber(string $rpcUrl, int $blockNumber, bool $fullTransactions = true): array
    {
        $block = $this->call($rpcUrl, 'eth_getBlockByNumber', [
            '0x'.dechex($blockNumber),
            $fullTransactions,
        ]);

        if (! is_array($block)) {
            throw new RuntimeException("Block {$blockNumber} not found");
        }

        return $block;
    }

    public function getLogs(
        string $rpcUrl,
        int $fromBlock,
        int $toBlock,
        string|array $contractAddresses,
    ): array {
        $addresses = is_array($contractAddresses)
            ? array_values(array_map(strtolower(...), $contractAddresses))
            : strtolower($contractAddresses);

        if ($addresses === [] || $addresses === '') {
            throw new RuntimeException('Contract address is required for eth_getLogs');
        }

        $filter = [
            'fromBlock' => '0x'.dechex($fromBlock),
            'toBlock' => '0x'.dechex($toBlock),
            'address' => $addresses,
        ];

        // Some RPC providers (e.g. Pocket Network) reject the `topics` filter.
        // Transfer events are filtered client-side in BlockchainIndex.
        $logs = $this->call($rpcUrl, 'eth_getLogs', [$filter]);

        return is_array($logs) ? $logs : [];
    }

    public function getTransactionCount(string $rpcUrl, string $address): int
    {
        $nonce = $this->call($rpcUrl, 'eth_getTransactionCount', [$address, 'pending']);

        return (int) hexdec((string) $nonce);
    }

    public function sendRawTransaction(string $rpcUrl, string $signedTx): string
    {
        $txHash = $this->call($rpcUrl, 'eth_sendRawTransaction', [$signedTx]);

        if (! is_string($txHash) || $txHash === '') {
            throw new RuntimeException('Failed to broadcast transaction');
        }

        return $txHash;
    }

    public function getGasPriceWei(string $rpcUrl): string
    {
        $gasPrice = $this->call($rpcUrl, 'eth_gasPrice');

        return (string) hexdec((string) $gasPrice);
    }

    public function getErc20Balance(string $rpcUrl, string $contractAddress, string $ownerAddress): string
    {
        $owner = str_pad(strtolower(ltrim($ownerAddress, '0x')), 64, '0', STR_PAD_LEFT);
        $data = '0x70a08231'.$owner;

        $result = $this->call($rpcUrl, 'eth_call', [[
            'to' => strtolower($contractAddress),
            'data' => $data,
        ], 'latest']);

        $hex = ltrim((string) $result, '0');
        $hex = ltrim($hex, 'x');
        $hex = ltrim($hex, '0');

        if ($hex === '') {
            return '0';
        }

        $decimal = '0';
        foreach (str_split($hex) as $char) {
            $decimal = bcadd(bcmul($decimal, '16', 0), (string) hexdec($char), 0);
        }

        return $decimal;
    }
}
