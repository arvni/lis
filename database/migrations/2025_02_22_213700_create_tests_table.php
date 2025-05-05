<?php

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Models\TestGroup;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code');
            $table->string('fullName');
            $table->text('description')->nullable();
            $table->foreignIdFor(TestGroup::class)->nullable();
            $table->enum('type', TestType::names())->default(TestType::TEST->name);
            $table->boolean('status')->default(true);
            $table->decimal('price', 16, 3)->nullable();
            $table->timestamps();
            $table->unique(["code", "type"]);
            $table->foreign("test_group_id")->references("id")->on("test_groups")->nullOnDelete();
        });

        Schema::create('report_template_test', function (Blueprint $table) {
            $table->foreignIdFor(ReportTemplate::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Test::class)->constrained()->cascadeOnDelete();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("report_template_test");
        Schema::dropIfExists('tests');
    }
};
