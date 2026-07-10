<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_gate_id')->constrained('gates');
            $table->foreignId('address_id')->constrained('addresses');
            $table->string('tx_hash');
            $table->unsignedInteger('log_index')->default(0);
            $table->unsignedBigInteger('block_number');
            $table->string('block_hash');
            $table->string('from_address');
            $table->string('to_address');
            $table->string('amount');
            $table->enum('status', ['CREATED', 'CONFIRMED', 'REORGED'])->default('CREATED');
            $table->unique(['asset_gate_id', 'tx_hash', 'log_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
