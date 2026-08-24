<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bearer cards: they carry no patient identity, only the partner and the rule.
        // A redemption never changes `status` — they are multi-use by design.
        Schema::create('discount_cards', function (Blueprint $table) {
            $table->id();
            // Random v4, never sequential: it is the whole secret in the QR.
            $table->uuid('uuid')->unique();
            $table->foreignId('discount_card_batch_id')->constrained('discount_card_batches')->cascadeOnDelete();
            $table->foreignId('discount_partner_id')->constrained('discount_partners')->restrictOnDelete();
            $table->string('series');
            $table->unsignedInteger('serial');
            // Human-readable fallback printed under the QR for manual entry.
            $table->string('number')->unique();
            $table->string('status')->default('INACTIVE'); // DiscountCardStatus enum
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->date('expires_at')->nullable();
            // Null = unlimited. `used_count` is a denormalised mirror of the redemption ledger.
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['series', 'serial']);
            $table->index(['discount_partner_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_cards');
    }
};
