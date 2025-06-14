<?php

use App\Domains\Laboratory\Models\SampleType;
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
        Schema::create('order_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Referrer::class)->constrained();
            $table->foreignIdFor(SampleType::class)->constrained();
            $table->unsignedBigInteger("server_id");
            $table->unsignedInteger("amount");
            $table->string("status");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_materials');
    }
};
