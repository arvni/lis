<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The catalogue of pay items that recur month after month, e.g. Housing allowance or an
        // insurance deduction. Defined once here and then picked on each contract that has one,
        // so the same item is named the same way everywhere.
        Schema::create('payroll_item_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150)->unique();
            // ALLOWANCE adds to pay, DEDUCTION takes away. A property of the item itself, which is
            // why it lives here instead of being repeated on every contract using it.
            $table->string('kind', 10);
            // Offered as the starting amount when the item is added to a contract; the contract
            // owns its own number from then on.
            $table->decimal('default_amount', 20, 3)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_item_types');
    }
};
