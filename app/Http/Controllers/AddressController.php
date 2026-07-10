<?php

namespace App\Http\Controllers;

use App\Http\Requests\NewAddressRequest;
use App\Models\Address;
use App\Models\Gate;
use App\Services\WalletService;

class AddressController extends Controller
{

    protected WalletService $walletService;
    public function __construct()
    {   
        $this->walletService = new WalletService();
    }

    public function getNewAddress(NewAddressRequest $request)
    {
        $gateConfig = config('gate.wallet-service');
        $gate = Gate::where('name', $request->gate)->first();

        $address = new Address();
        $address->gate_id = $gate->id;
        $address->account = $gateConfig['account'];
        $address->change = $gateConfig['change'];
        $address->address_index = (Address::max('address_index') ?? 0) + 1;

        try {
            $address->address = $this->walletService->createAddress($address, $gate->type);
            $address->saveOrFail();
            return response()->json([
                'address' => $address->address,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
