<?php

use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\Test;
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
        Schema::create('method_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Method::class)->nullable();
            $table->foreignIdFor(Test::class, )->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('status')->default(true);
            $table->timestamps();
            $table->foreign('method_id')->references('id')->on('methods')->restrictOnDelete();
            $table->foreign('test_id')->references('id')->on('tests')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('method_tests');
    }
};
