<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            // What the lots held, what the ledger says they should have held,
            // and the correction that was written to close the gap.
            $table->decimal('previous_base_units', 15, 6);
            $table->decimal('expected_base_units', 15, 6);
            $table->decimal('difference_base_units', 15, 6);
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['item_id', 'store_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_reconciliations');
    }
};
