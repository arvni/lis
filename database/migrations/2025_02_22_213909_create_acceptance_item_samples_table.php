<?php

use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Sample;
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
        Schema::create('acceptance_item_samples', function (Blueprint $table) {
            $table->foreignIdFor(AcceptanceItem::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Sample::class)->constrained()->restrictOnDelete();
            $table->boolean('active')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acceptance_item_samples');
    }
};
