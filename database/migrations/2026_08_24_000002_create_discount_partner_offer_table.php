<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // An offer only ever moves money once it is attached to a partner contract here,
        // which keeps the pre-existing (never applied) offer rows inert.
        Schema::create('discount_partner_offer', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discount_partner_id')->constrained('discount_partners')->cascadeOnDelete();
            $table->foreignId('offer_id')->constrained('offers')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['discount_partner_id', 'offer_id'], 'discount_partner_offer_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_partner_offer');
    }
};
