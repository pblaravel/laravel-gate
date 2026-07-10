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
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gate_id')->constrained('gates');
            $table->unsignedBigInteger('account');
            $table->unsignedBigInteger('change');
            $table->unsignedBigInteger('address_index');
            $table->string('address');
            $table->boolean('balance')->default('0');
            $table->unique(['gate_id', 'account', 'change', 'address_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
