<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_export_request_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_export_request_id')->constrained('stock_export_requests')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('event');
            $table->text('notes')->nullable();
            $table->text('change_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_export_request_histories');
    }
};
