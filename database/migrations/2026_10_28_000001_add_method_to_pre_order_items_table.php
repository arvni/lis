<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The method BION picked for a test line: a non-panel test is priced per method, the way the
 * lab prices an acceptance. Never shown to the center; panels have none.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pre_order_items', function (Blueprint $table) {
            $table->foreignId('method_test_id')->nullable()->after('test_id')->constrained('method_tests')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pre_order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('method_test_id');
        });
    }
};
