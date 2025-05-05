<?php

use App\Domains\Billing\Models\Invoice;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Laboratory\Models\Doctor;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('acceptances', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class, 'acceptor_id')->constrained();
            $table->foreignIdFor(Consultation::class)->nullable();
            $table->foreignIdFor(Doctor::class)->nullable();
            $table->foreignIdFor(Invoice::class,)->nullable();
            $table->foreignIdFor(Patient::class, 'patient_id')->constrained();
            $table->foreignIdFor(Referrer::class)->nullable();
            $table->string('referenceCode')->nullable();
            $table->boolean('samplerGender')->nullable();
            $table->json('howReport')->nullable();
            $table->string('status')->default(AcceptanceStatus::PENDING);
            $table->boolean('out_patient')->default(false);
            $table->integer("step")->default(2);
            $table->timestamps();
            $table->foreign('consultation_id')->references('id')->on('consultations')->nullOnDelete();
            $table->foreign('doctor_id')->references('id')->on('doctors')->nullOnDelete();
            $table->foreign('invoice_id')->references('id')->on('invoices')->nullOnDelete();
            $table->foreign('referrer_id')->references('id')->on('referrers')->restrictOnDelete();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acceptances');
    }
};
