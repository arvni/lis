<?php

use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\SampleCollector;
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
        Schema::create('collect_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(SampleCollector::class)->constrained()->restrictOnDelete();
            $table->foreignIdFor(Referrer::class)->constrained()->restrictOnDelete();
            $table->json('logistic_information')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collect_requests');
    }
};
