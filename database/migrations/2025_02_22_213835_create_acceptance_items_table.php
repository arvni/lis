<?php

use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Reception\Models\Acceptance;
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
        Schema::create('acceptance_items', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Acceptance::class, 'acceptance_id')->constrained()->cascadeOnDelete();
            $table->foreignIdFor(MethodTest::class)->nullable();
            $table->unsignedBigInteger('price');
            $table->decimal('discount', 20, 3)->unsigned();
            $table->json('timeline')->nullable();
            $table->json('customParameters')->nullable();
            $table->timestamps();
            $table->foreign('method_test_id')->references('id')->on('method_tests')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acceptance_items');
    }
};
