<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('acceptance_items', 'panel_id'))
            Schema::table('acceptance_items', function (Blueprint $table) {
                $table->uuid('panel_id')->nullable()->after('method_test_id');
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('acceptance_items', 'panel_id'))
        Schema::table('acceptance_items', function (Blueprint $table) {
            $table->dropColumn('panel_id');
        });
    }
};
