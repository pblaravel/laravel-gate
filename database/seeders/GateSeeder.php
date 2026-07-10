<?php

namespace Database\Seeders;

use App\Models\Gate;
use Illuminate\Database\Seeder;

class GateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Gate::create([
            'name' => 'eth_sepolia',
            'type' => 'ethereum',
            'rpc_url' => 'https://ethereum-sepolia-rpc.publicnode.com',
            'chain_id' => '11155111',
            'confirmations_required' => 12,
            'parent_gate_id' => null,
            'asset_type' => 'NATIVE',
            'token_contract' => null,
        ]);
        Gate::create([
            'name' => 'usdc_sepolia',
            'type' => 'ethereum',
            'rpc_url' => 'https://ethereum-sepolia-rpc.publicnode.com',
            'chain_id' => '11155111',
            'confirmations_required' => 12,
            'parent_gate_id' => 1,
            'asset_type' => 'ERC20',
            'token_contract' => '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            'token_decimals' => 6,
        ]);
    }
}