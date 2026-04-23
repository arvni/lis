<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_request_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('transaction_id')->constrained('stock_transactions')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_request_receipt_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receipt_id')->constrained('purchase_request_receipts')->cascadeOnDelete();
            $table->foreignId('pr_line_id')->constrained('purchase_request_lines')->restrictOnDelete();
            $table->decimal('qty_received', 15, 6);
            $table->decimal('unit_price', 15, 4)->nullable();
            $table->string('lot_number')->nullable();
            $table->string('brand')->nullable();
            $table->string('cat_no')->nullable();
            $table->date('expiry_date')->nullable();
            $table->foreignId('store_location_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_receipt_lines');
        Schema::dropIfExists('purchase_request_receipts');
    }
};
