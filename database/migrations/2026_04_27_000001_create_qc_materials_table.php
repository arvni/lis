<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_materials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('level', ['low', 'normal', 'high']);
            $table->string('lot_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_materials');
    }
};
