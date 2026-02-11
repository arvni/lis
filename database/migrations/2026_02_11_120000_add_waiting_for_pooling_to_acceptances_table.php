<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            $table->boolean('waiting_for_pooling')->default(false)->after('out_patient');
        });
    }

    public function down(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            $table->dropColumn('waiting_for_pooling');
        });
    }
};
