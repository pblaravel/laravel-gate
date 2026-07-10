<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deposit extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'asset_gate_id',
        'address_id',
        'tx_hash',
        'log_index',
        'block_number',
        'block_hash',
        'from_address',
        'to_address',
        'amount',
        'status',
    ];

    public function assetGate(): BelongsTo
    {
        return $this->belongsTo(Gate::class, 'asset_gate_id');
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }
}
