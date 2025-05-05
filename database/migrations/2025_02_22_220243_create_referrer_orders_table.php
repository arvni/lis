<?php

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Models\User;
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
        Schema::create('referrer_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Acceptance::class)->nullable();
            $table->foreignIdFor(Patient::class)->nullable();
            $table->foreignIdFor(Referrer::class)->constrained()->restrictOnDelete();
            $table->foreignIdFor(User::class)->nullable();
            $table->string('order_id')->unique();
            $table->enum('status', ['waiting', 'processing', 'reported', 'downloaded'])->default('waiting');
            $table->json('orderInformation');
            $table->json('logisticInformation')->nullable();
            $table->string('reference_no')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamps();
            $table->foreign('acceptance_id')->references('id')->on('acceptances')->nullOnDelete();
            $table->foreign('patient_id')->references('id')->on('patients')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referrer_orders');
    }
};
