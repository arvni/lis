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
        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_type'); // TransactionType enum
            $table->string('reference_number')->unique();
            $table->date('transaction_date');
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('destination_store_id')->nullable()->constrained('stores')->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('requested_by_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('DRAFT'); // TransactionStatus enum
            $table->text('notes')->nullable();
            $table->string('attachment')->nullable();
            $table->decimal('total_value', 15, 4)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transactions');
    }
};
