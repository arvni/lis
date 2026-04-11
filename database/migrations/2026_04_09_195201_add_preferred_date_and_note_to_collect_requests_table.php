<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->dateTime('preferred_date')->nullable()->after('barcode');
            $table->text('note')->nullable()->after('preferred_date');
            $table->dropColumn('logistic_information');
        });
    }

    public function down(): void
    {
        Schema::table('collect_requests', function (Blueprint $table) {
            $table->dropColumn(['preferred_date', 'note']);
            $table->json('logistic_information')->nullable()->after('barcode');
        });
    }
};
