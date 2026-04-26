<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('qc_material_id')->constrained('qc_materials')->cascadeOnDelete();
            $table->foreignId('method_test_id')->constrained('method_tests')->cascadeOnDelete();
            $table->decimal('mean', 12, 4);
            $table->decimal('sd', 12, 4);
            $table->string('unit')->nullable();
            $table->timestamps();

            $table->unique(['qc_material_id', 'method_test_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_targets');
    }
};
