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
        Schema::create('stock_transaction_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('stock_transactions')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            $table->decimal('quantity', 15, 6);
            $table->decimal('quantity_base_units', 15, 6);
            $table->string('lot_number')->nullable();
            $table->string('barcode')->nullable();
            $table->date('expiry_date')->nullable();
            $table->foreignId('store_location_id')->nullable()->constrained('store_locations')->nullOnDelete();
            $table->decimal('unit_price', 15, 4)->nullable();
            $table->decimal('total_price', 15, 4)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transaction_lines');
    }
};
