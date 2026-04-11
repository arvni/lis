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
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->json('logistic_information')->nullable()->after('barcode');
        });
    }

    public function down(): void
    {
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->dropColumn('logistic_information');
        });
    }
};
