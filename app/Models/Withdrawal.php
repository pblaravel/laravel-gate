<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends Model
{
    public const STATUS_CREATED = 'CREATED';

    public const STATUS_BROADCASTED = 'BROADCASTED';

    public const STATUS_FAILED = 'FAILED';

    protected $fillable = [
        'asset_gate_id',
        'to_address',
        'amount',
        'amount_base_units',
        'status',
        'tx_hash',
        'signed_tx',
        'error',
    ];

    public function assetGate(): BelongsTo
    {
        return $this->belongsTo(Gate::class, 'asset_gate_id');
    }
}
