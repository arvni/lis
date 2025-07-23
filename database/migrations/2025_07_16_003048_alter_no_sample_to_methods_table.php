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
        Schema::table('methods', function (Blueprint $table) {
            $table->unsignedInteger("no_sample")->after("no_patient")->default(1);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('methods', function (Blueprint $table) {
            $table->dropColumn("no_sample");
        });
    }
};
