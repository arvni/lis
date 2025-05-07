<?php

use App\Domains\Consultation\Models\Consultant;
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
        Schema::create('times', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Consultant::class)->constrained();
            $table->nullableMorphs('reservable');
            $table->string("title");
            $table->timestamp("started_at");
            $table->timestamp("ended_at");
            $table->boolean("active")->default(true);
            $table->timestamps();
            $table->unique(['consultant_id', 'started_at', 'ended_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('times');
    }
};
