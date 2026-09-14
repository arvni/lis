<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Which shift a user works, and from when. Kept as history (never overwritten) so past days
        // are judged against the shift the person actually had then. A user's assignments never overlap.
        Schema::create('user_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // A shift that was ever assigned cannot be deleted; retire it with is_active instead.
            $table->foreignId('shift_id')->constrained()->restrictOnDelete();
            $table->date('effective_from');
            // Null while the assignment is still running.
            $table->date('effective_to')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'effective_from']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_shifts');
    }
};
