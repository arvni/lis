<?php

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Sample;
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
        Schema::create('samples', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Patient::class, 'patient_id')->constrained()->cascadeOnDelete();
            $table->foreignIdFor(SampleType::class, 'sample_type_id')->constrained()->restrictOnDelete();
            $table->foreignIdFor(User::class, 'sampler_id')->constrained()->restrictOnDelete();
            $table->foreignIdFor(Sample::class)->nullable();
            $table->foreignIdFor(User::class,'qc_by_id')->nullable();
            $table->string('status')->default('waiting');
            $table->string('barcode');
            $table->text('store_address')->nullable();
            $table->string('sampleLocation')->default('in Lab');
            $table->timestamp('collection_date')->nullable();
            $table->timestamps();
            $table->foreign('sample_id')->references('id')->on('samples')->nullOnDelete();
            $table->foreign('qc_by_id')->references('id')->on('users')->restrictOnDelete();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('samples');
    }
};
