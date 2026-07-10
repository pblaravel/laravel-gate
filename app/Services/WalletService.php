<?php

namespace App\Services;

use App\Models\Address;
use Illuminate\Support\Facades\Http;

class WalletService
{
    private array $gateConfig;

    public function __construct()
    {
        $this->gateConfig = config('gate.wallet-service');
    }
    public function createAddress(Address $address, string $gate) : string
    {
        return $this->deriveAddress($gate, $address->account, $address->change, $address->address_index);
    }

    public function deriveAddress(string $gate, int $account, int $change, int $addressIndex): string
    {
        $response = Http::post($this->gateConfig['url'] . '/api/v1/createaddress', [
            'gate' => $gate,
            'account' => $account,
            'change' => $change,
            'address_index' => $addressIndex,
        ]);
        if ($response->successful()) {
            return $response->json()['address'];
        }
        throw new \Exception('Failed to create address');
    }

    public function verifyAddress(string $address, string $gate) : bool
    {
        $response = Http::post($this->gateConfig['url'] . '/api/v1/validateaddress', [
            'gate' => $gate,
            'address' => $address,
        ]);
        if ($response->successful()) {
            return $response->json()['valid'];
        }
        throw new \Exception('Failed to validate address');
    }

    /**
     * @param  array<string, mixed>  $txParams
     * @return array{tx_hash: string, signed_tx: string}
     */
    public function createSignedTransaction(
        int $account,
        int $change,
        int $addressIndex,
        array $txParams,
    ): array {
        $response = Http::post($this->gateConfig['url'].'/api/v1/tx', [
            'gate' => $this->gateConfig['gate'],
            'account' => $account,
            'change' => $change,
            'address_index' => $addressIndex,
            'tx_params' => $txParams,
        ]);

        if (! $response->successful()) {
            $message = $response->json('error') ?? 'Failed to create signed transaction';
            throw new \Exception($message);
        }

        return [
            'tx_hash' => $response->json('tx_hash'),
            'signed_tx' => $response->json('signed_tx'),
        ];
    }
}