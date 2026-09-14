<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // The person's "Employee ID" in HikCentral: door punches arrive keyed by it.
            // A string, since device-side IDs may carry leading zeros.
            $table->string('attendance_number', 64)->nullable()->unique()->after('username');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['attendance_number']);
            $table->dropColumn('attendance_number');
        });
    }
};
