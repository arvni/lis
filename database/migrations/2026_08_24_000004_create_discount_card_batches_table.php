<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One print run. Its expiry/usage limit are the defaults stamped onto every
        // card it issues; a card can later be tightened individually.
        Schema::create('discount_card_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discount_partner_id')->constrained('discount_partners')->restrictOnDelete();
            $table->string('series')->unique();
            $table->string('prefix', 16)->nullable();
            $table->unsignedInteger('quantity');
            $table->date('expires_at')->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('printed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_card_batches');
    }
};
