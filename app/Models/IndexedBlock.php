<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IndexedBlock extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'base_gate_id',
        'block_number',
        'block_hash',
        'parent_hash',
    ];

    public function baseGate(): BelongsTo
    {
        return $this->belongsTo(Gate::class, 'base_gate_id');
    }
}
