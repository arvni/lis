<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitoring_samples', function (Blueprint $table) {
            $table->id();
            $table->string('node_id')->index();
            $table->timestamp('sampled_at');
            $table->decimal('temperature', 8, 2)->nullable();
            $table->decimal('humidity',    8, 2)->nullable();
            $table->timestamps();

            $table->unique(['node_id', 'sampled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitoring_samples');
    }
};
