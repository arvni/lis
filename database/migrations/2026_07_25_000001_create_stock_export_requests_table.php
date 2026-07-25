<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_export_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requested_by_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            // Source store the stock is dispatched out of.
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            // Where the stock is going (recipient department / section / external destination).
            $table->string('destination');
            $table->text('purpose')->nullable();
            $table->string('urgency')->default('NORMAL'); // LOW / NORMAL / HIGH / URGENT
            $table->text('notes')->nullable();
            $table->string('status')->default('DRAFT'); // StockExportRequestStatus enum
            $table->foreignId('workflow_template_id')->nullable()->constrained('workflow_templates')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_export_requests');
    }
};
