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
        Schema::table('acceptances', function (Blueprint $table) {
            $table->softDeletes();
            // What the delete took down with it: the ids of the items and item
            // states this acceptance's delete soft-deleted, so a restore brings
            // back exactly those and leaves rows deleted earlier, on their own,
            // alone. deleted_at is only second-precision, so timestamps cannot
            // tell the two apart.
            $table->json('restore_point')->nullable()->after('deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            $table->dropColumn('restore_point');
            $table->dropSoftDeletes();
        });
    }
};
