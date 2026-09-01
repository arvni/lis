<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_lot_relocations', function (Blueprint $table) {
            $table->id();
            // The lot the stock was taken from. On a full move this is also the
            // lot that now sits at the destination.
            $table->foreignId('stock_lot_id')->constrained('stock_lots')->restrictOnDelete();
            // Set when a partial move split the stock onto another lot row.
            $table->foreignId('destination_lot_id')->nullable()->constrained('stock_lots')->nullOnDelete();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->decimal('quantity_base_units', 15, 6);
            $table->foreignId('from_store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('from_store_location_id')->nullable()->constrained('store_locations')->nullOnDelete();
            $table->foreignId('to_store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('to_store_location_id')->nullable()->constrained('store_locations')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['item_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_lot_relocations');
    }
};
