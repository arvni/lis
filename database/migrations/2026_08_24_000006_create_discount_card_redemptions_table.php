<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The audit trail the lab settles nothing against — nobody is billed for these —
        // but which powers usage limits, the usage report, and abuse detection.
        Schema::create('discount_card_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discount_card_id')->constrained('discount_cards')->cascadeOnDelete();
            $table->foreignId('acceptance_id')->constrained('acceptances')->cascadeOnDelete();
            $table->foreignId('acceptance_item_id')->constrained('acceptance_items')->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('offer_id')->constrained('offers')->restrictOnDelete();
            $table->decimal('amount', 20, 3)->default(0);
            $table->foreignId('applied_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('reverted_at')->nullable();
            $table->string('revert_reason')->nullable();
            $table->timestamps();

            $table->unique(['discount_card_id', 'acceptance_item_id'], 'discount_card_acceptance_item_unique');
            $table->index(['discount_card_id', 'applied_at']);
            $table->index(['acceptance_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_card_redemptions');
    }
};
