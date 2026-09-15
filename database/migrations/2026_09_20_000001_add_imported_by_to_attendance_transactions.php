<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Punches can also be imported from an Excel file (e.g. when HikCentral could not reach the
        // database). Who imported a punch is kept so hand-supplied punches stay traceable; HikCentral
        // never maps this column, so its rows leave it NULL.
        Schema::table('attendance_transactions', function (Blueprint $table) {
            $table->foreignId('imported_by')->nullable()->after('access_time')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('attendance_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('imported_by');
        });
    }
};
