<?php

use App\Domains\Reception\Models\Patient;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Patient::class)->nullable();
            $table->string('name');
            $table->string('email')->unique()->nullable();
            $table->string("phone")->unique();
            $table->timestamps();
            $table->foreign('patient_id')->references('id')->on('patients')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
