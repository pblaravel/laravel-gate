<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $table = 'addresses';
    public $timestamps = false;
    protected $fillable = [
        'gate_id',
        'account',
        'change',
        'address_index',
        'address',
        'balance',
    ];

    public function gate(): BelongsTo
    {
        return $this->belongsTo(Gate::class);
    }
}
