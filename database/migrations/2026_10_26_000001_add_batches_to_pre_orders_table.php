<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sample batches after the first shipment of each release: another embryo cycle, a parent's
 * blood, a replacement. A batch is either its own order (per-batch flows) or more samples for an
 * order the pre-order already has, so it is a json list here rather than a table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pre_orders', function (Blueprint $table) {
            // [{key, label, purpose, order_key, source?, replaces?, side, by, at}]
            $table->json('batches')->nullable()->after('clinical');
        });
    }

    public function down(): void
    {
        Schema::table('pre_orders', function (Blueprint $table) {
            $table->dropColumn('batches');
        });
    }
};
