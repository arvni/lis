<?php

use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\Workflow;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('section_workflows', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Section::class, 'section_id')->constrained()->restrictOnDelete();
            $table->foreignIdFor(Workflow::class, 'workflow_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('order');
            $table->longText('parameters');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('section_workflows');
    }
};
