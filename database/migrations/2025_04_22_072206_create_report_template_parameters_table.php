<?php

use App\Domains\Laboratory\Models\ReportTemplate;
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
        Schema::create('report_template_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(ReportTemplate::class)->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type');
            $table->boolean("required")->default(false);
            $table->boolean("active")->default(true);
            $table->json("custom_props")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_template_parameters');
    }
};
