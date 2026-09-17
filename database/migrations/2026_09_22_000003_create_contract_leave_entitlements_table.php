<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // How much leave of each kind the contract grants. Until now nothing recorded what anyone
        // was entitled to, so leave could be counted but never balanced.
        Schema::create('contract_leave_entitlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employment_contract_id')->constrained()->cascadeOnDelete();
            // A kind that has been granted to someone cannot be deleted; retire it with is_active.
            $table->foreignId('leave_kind_id')->constrained()->restrictOnDelete();
            // The whole allowance for the contract's duration, not a yearly rate: it is never
            // prorated, and a shorter contract simply grants less.
            $table->decimal('entitled_days', 5, 1);
            $table->timestamps();

            // Named by hand: the generated name runs past MySQL's 64-character identifier limit.
            $table->unique(['employment_contract_id', 'leave_kind_id'], 'cle_contract_kind_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_leave_entitlements');
    }
};
