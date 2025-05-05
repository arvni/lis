<?php

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
        Schema::create('patient_metas', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Patient::class)->unique()->constrained()->cascadeOnDelete();
            $table->tinyInteger('maritalStatus')->nullable();
            $table->string('company')->nullable();
            $table->string('profession')->nullable();
            $table->string('avatar')->nullable();
            $table->text('address')->nullable();
            $table->string('email')->nullable();
            $table->longText('details')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_metas');
    }
};
