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
        Schema::table('referrer_orders', function (Blueprint $table) {
            $table->boolean('needs_add_sample')->default(true)->after('pooling');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('referrer_orders', function (Blueprint $table) {
            $table->dropColumn('needs_add_sample');
        });
    }
};
