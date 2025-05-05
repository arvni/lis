<?php

use App\Domains\Laboratory\Models\ReportTemplateParameter;
use App\Domains\Reception\Models\Report;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('report_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Report::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(ReportTemplateParameter::class, "parameter_id")->constrained()->restrictOnDelete();
            $table->json("value");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_parameters');
    }
};
