<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Raw door punches, INSERTed by HikCentral Access Control in "third-party database" mode
        // (see docs/attendance-hikcentral.md). The LIS only reads this table. Column names match the
        // field mapping configured in HikCentral, so do not rename them without changing it there.
        Schema::create('attendance_transactions', function (Blueprint $table) {
            $table->id();
            // HikCentral "Employee ID" = users.attendance_number. No foreign key: a punch from a person
            // the LIS does not know yet must still be stored.
            $table->string('attendance_id', 64);
            $table->dateTime('access_date_and_time');
            // Convenience copies HikCentral writes alongside; the LIS relies on access_date_and_time.
            $table->date('access_date')->nullable();
            $table->time('access_time')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['attendance_id', 'access_date_and_time']);
            $table->index('access_date_and_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_transactions');
    }
};
