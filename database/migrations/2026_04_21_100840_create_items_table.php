<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('item_code')->unique();
            $table->string('name');
            $table->string('scientific_name')->nullable();
            $table->string('department'); // ItemDepartment enum value
            $table->string('material_type'); // ItemMaterialType enum value
            $table->text('description')->nullable();
            $table->string('storage_condition');
            $table->text('storage_condition_notes')->nullable();
            $table->foreignId('default_unit_id')->constrained('units')->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_hazardous')->default(false);
            $table->boolean('requires_lot_tracking')->default(true);
            $table->decimal('minimum_stock_level', 15, 6)->default(0);
            $table->decimal('maximum_stock_level', 15, 6)->nullable();
            $table->unsignedInteger('lead_time_days')->nullable();
            $table->string('image')->nullable();
            $table->string('msds_file')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
