<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acceptance_item_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('acceptance_item_id')->constrained('acceptance_items')->cascadeOnDelete();
            $table->foreignId('from_method_test_id')->constrained('method_tests')->restrictOnDelete();
            $table->foreignId('to_method_test_id')->constrained('method_tests')->restrictOnDelete();
            $table->enum('conversion_type', ['eject_panel', 'promote_to_panel']);
            $table->foreignId('converted_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('converted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acceptance_item_conversions');
    }
};
