<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_export_request_fulfillments', function (Blueprint $table) {
            $table->id();
            // Explicit short FK name — the default would exceed MySQL's 64-char identifier limit.
            $table->foreignId('stock_export_request_id')
                ->constrained('stock_export_requests', indexName: 'serf_request_id_fk')
                ->cascadeOnDelete();
            $table->foreignId('transaction_id')->constrained('stock_transactions')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_export_request_fulfillment_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fulfillment_id')->constrained('stock_export_request_fulfillments')->cascadeOnDelete();
            $table->foreignId('export_line_id')->constrained('stock_export_request_lines')->restrictOnDelete();
            $table->decimal('qty_fulfilled', 15, 6);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_export_request_fulfillment_lines');
        Schema::dropIfExists('stock_export_request_fulfillments');
    }
};
