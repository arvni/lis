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
        Schema::create('stock_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->string('lot_number');
            $table->string('barcode')->unique()->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('manufacture_date')->nullable();
            $table->date('received_date');
            $table->decimal('quantity_base_units', 15, 6)->default(0);
            $table->decimal('unit_price_base', 15, 4)->default(0);
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('store_location_id')->nullable()->constrained('store_locations')->nullOnDelete();
            $table->string('status')->default('ACTIVE'); // LotStatus enum
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_lots');
    }
};
