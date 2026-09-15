<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // One row per working weekday; a weekday without a row is a day off. The pattern repeats every week.
        Schema::create('shift_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained()->cascadeOnDelete();
            // Carbon's dayOfWeek: 0 = Sunday … 6 = Saturday.
            $table->unsignedTinyInteger('weekday');
            // Same-day hours only: start_time is always before end_time (no overnight shifts).
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();

            $table->unique(['shift_id', 'weekday']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_days');
        Schema::dropIfExists('shifts');
    }
};
