<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pre-order settings per test: {can_be_main, scope_fields (phase 2)}. Kept out of tests.extra,
 * which holds the pricing formula and is rewritten by the pricing editor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->json('preorder')->nullable()->after('flow_id');
        });
    }

    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->dropColumn('preorder');
        });
    }
};
