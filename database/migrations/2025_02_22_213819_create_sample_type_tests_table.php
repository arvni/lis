<?php

use App\Domains\Laboratory\Models\SampleType;
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
        Schema::create('sample_type_tests', function (Blueprint $table) {
            $table->foreignIdFor(Test::class,)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(SampleType::class)->constrained()->cascadeOnDelete();
            $table->longText('description');
            $table->boolean('defaultType')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sample_type_tests');
    }
};
