<?php

use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultant;
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
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Patient::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Consultant::class)->constrained()->restrictOnDelete();
            $table->timestamp('dueDate');
            $table->json('information')->nullable();
            $table->enum('status', ConsultationStatus::values());
            $table->string('image')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
