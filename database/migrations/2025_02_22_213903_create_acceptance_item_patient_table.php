<?php

use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
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
        Schema::create('acceptance_item_patient', function (Blueprint $table) {
            $table->foreignIdFor(AcceptanceItem::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Patient::class)->constrained()->restrictOnDelete();
            $table->integer('order');
            $table->boolean("main")->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acceptance_item_patient');
    }
};
