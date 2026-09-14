<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per person per day, built from HikCentral punches by `attendance:process`.
        Schema::create('attendance_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            // The shift and hours the day was judged against, copied so a later edit to the shift
            // leaves past days as they were.
            $table->foreignId('shift_id')->nullable()->constrained()->nullOnDelete();
            $table->time('scheduled_start')->nullable();
            $table->time('scheduled_end')->nullable();
            // First and last punch of the day.
            $table->dateTime('check_in')->nullable();
            $table->dateTime('check_out')->nullable();
            $table->string('status', 20);
            $table->unsignedSmallInteger('late_minutes')->default(0);
            $table->unsignedSmallInteger('early_leave_minutes')->default(0);
            $table->unsignedSmallInteger('worked_minutes')->default(0);
            // Corrected by hand: the scheduled job leaves the day alone until someone resets it.
            $table->boolean('is_manual')->default(false);
            $table->string('note', 500)->nullable();
            $table->foreignId('corrected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('corrected_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'date']);
            $table->index(['date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_days');
    }
};
