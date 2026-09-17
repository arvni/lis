<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allowances and deductions moved off the contract and onto the person (payroll_items).
     * Hanging them on a contract was wrong: a loan does not stop being owed because the contract
     * it began under was replaced, and a housing allowance does not restart with a new one.
     */
    public function up(): void
    {
        Schema::dropIfExists('contract_allowances');
    }

    public function down(): void
    {
        Schema::create('contract_allowances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employment_contract_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payroll_item_type_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 20, 3);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['employment_contract_id', 'payroll_item_type_id'], 'ca_contract_item_unique');
        });
    }
};
