<?php

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Models\BarcodeGroup;
use App\Domains\Laboratory\Models\Workflow;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('methods', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Workflow::class)->nullable();
            $table->foreignIdFor(BarcodeGroup::class)->nullable();
            $table->string('name');
            $table->unsignedInteger('turnaround_time')->nullable();
            $table->double('price', 8, 2)->unsigned();
            $table->enum('price_type', MethodPriceType::values())->default('Fix');
            $table->longText('requirements')->nullable();
            $table->boolean('status')->default(true);
            $table->longText('extra')->nullable();
            $table->unsignedInteger('no_patient')->default(1);
            $table->timestamps();
            $table->foreign('workflow_id')->references('id')->on('workflows')->restrictOnDelete();
            $table->foreign('barcode_group_id')->references('id')->on('barcode_groups')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('methods');
    }
};
