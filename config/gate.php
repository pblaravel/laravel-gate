<?php

return [
    'wallet-service' => [
        'name' => 'Wallet Service',
        'url' => env('WALLET_SERVICE_URL'),
        'gate' => env('WALLET_SERVICE_GATE', 'ethereum'),
        'account' => 0,
        'change' => 0,
        'address_index' => 0,
    ],
];
