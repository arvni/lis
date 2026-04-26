<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('qc_target_id')->constrained('qc_targets')->cascadeOnDelete();
            $table->foreignId('analyst_id')->constrained('users');
            $table->decimal('value', 12, 4);
            $table->timestamp('run_at');
            $table->enum('status', ['pass', 'warning', 'fail'])->default('pass');
            $table->json('violations')->nullable();   // Westgard rule names triggered
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_runs');
    }
};
