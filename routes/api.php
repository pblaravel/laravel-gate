<?php

use App\Http\Controllers\AddressController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::post('v1/new-address', [AddressController::class, 'getNewAddress']);
Route::post('v1/withdrawal', [TransactionController::class, 'withdraw']);