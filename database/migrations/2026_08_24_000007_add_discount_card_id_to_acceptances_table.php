<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            // The card presented at reception. Single source of truth for which
            // contract discounts this acceptance; the amounts land on its items.
            $table->foreignId('discount_card_id')
                ->nullable()
                ->after('referrer_id')
                ->constrained('discount_cards')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            $table->dropConstrainedForeignId('discount_card_id');
        });
    }
};
