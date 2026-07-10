<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gate extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
        'type',
        'rpc_url',
        'chain_id',
        'confirmations_required',
        'parent_gate_id',
        'asset_type',
        'token_contract',
        'token_decimals',
    ];

    public function parentGate(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_gate_id');
    }

    public function childGates(): HasMany
    {
        return $this->hasMany(self::class, 'parent_gate_id');
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }
}
