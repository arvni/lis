<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Every hand edit of a person's recorded times, with the values before and after.
        Schema::create('attendance_day_changes', function (Blueprint $table) {
            $table->id();
            // The person and date are kept on the change itself, so the history survives when the
            // day's row is later removed (e.g. it no longer applies after recalculating).
            $table->foreignId('attendance_day_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('action', 12);
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('note', 500)->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_day_changes');
    }
};
