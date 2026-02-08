<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('acceptance_items', function (Blueprint $table) {
            $table->boolean('sampleless')->default(false)->after('reportless');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('acceptance_items', function (Blueprint $table) {
            $table->dropColumn('sampleless');
        });
    }
};
