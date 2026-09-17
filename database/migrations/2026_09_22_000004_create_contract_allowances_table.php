<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The catalogue items that apply to one contract, with this person's amount for each.
        // Only recurring items live here: a one-off bonus is added to the slip when it is printed.
        Schema::create('contract_allowances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employment_contract_id')->constrained()->cascadeOnDelete();
            // An item still referenced by a contract cannot be deleted; retire it with is_active.
            $table->foreignId('payroll_item_type_id')->constrained()->restrictOnDelete();
            // Always concrete. Prefilled from the type's default when picked, but owned by the
            // contract from then on, so editing the catalogue never rewrites an existing contract
            // or changes what an earlier month reprints as.
            $table->decimal('amount', 20, 3);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            // Named by hand: the generated name runs past MySQL's 64-character identifier limit.
            $table->unique(['employment_contract_id', 'payroll_item_type_id'], 'ca_contract_item_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_allowances');
    }
};
