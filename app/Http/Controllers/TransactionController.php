<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateTxRequest;
use App\Services\WithdrawalService;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    public function __construct(
        private readonly WithdrawalService $withdrawalService,
    ) {
    }

    public function withdraw(CreateTxRequest $request): JsonResponse
    {
        try {
            $result = $this->withdrawalService->createAndBroadcast(
                $request->validated('asset_gate'),
                $request->validated('from_address'),
                $request->validated('to_address'),
                $request->validated('amount'),
            );

            return response()->json($result);
        } catch (\Throwable $exception) {
            return response()->json([
                'error' => $exception->getMessage(),
            ], 500);
        }
    }
}
