<?php

use App\Domains\Laboratory\Models\Test;
use App\Domains\Referrer\Models\Referrer;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('referrer_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Referrer::class, 'referrer_id')->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Test::class)->constrained()->cascadeOnDelete();
            $table->decimal('price', 8, 4)->unsigned()->nullable();
            $table->json("methods")->nullable();
            $table->timestamps();
            $table->unique(['referrer_id', 'test_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referrer_tests');
    }
};
