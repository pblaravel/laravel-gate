<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('gates', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->string('type')->default('ethereum');
            $table->string('rpc_url')->nullable();
            $table->string('chain_id')->nullable();
            $table->integer('confirmations_required');
            $table->foreignId('parent_gate_id')->nullable()->constrained('gates');
            $table->enum('asset_type', ['NATIVE', 'ERC20']);
            $table->integer('token_decimals')->nullable();
            $table->string('token_contract')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gates');
    }
};
