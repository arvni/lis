<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_barcodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->string('barcode');
            $table->string('label')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index('barcode');
            $table->unique(['item_id', 'barcode']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_barcodes');
    }
};
