<?php

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Reception\Models\Sample;
use App\Domains\Referrer\Models\OrderMaterial;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(SampleType::class)
                ->constrained();
            $table->foreignIdFor(OrderMaterial::class)->nullable();
            $table->string("packing_series");
            $table->string("barcode")
                ->unique()
                ->index();
            $table->string("tube_barcode")
                ->index()
                ->nullable();
            $table->timestamp("expire_date")
                ->nullable();
            $table->timestamp("assigned_at")
                ->nullable();
            $table->timestamps();
            $table->foreign('order_material_id')
                ->references('id')
                ->on('order_materials')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};
