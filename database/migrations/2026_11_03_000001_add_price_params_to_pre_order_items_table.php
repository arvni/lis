<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The values a formula or conditional price was worked out from (e.g. the number of embryos),
 * so a revised quotation can change them. Null on a fixed-price line.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pre_order_items', function (Blueprint $table) {
            $table->json('price_params')->nullable()->after('unit_price');
        });
    }

    public function down(): void
    {
        Schema::table('pre_order_items', function (Blueprint $table) {
            $table->dropColumn('price_params');
        });
    }
};
