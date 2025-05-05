<?php

use App\Domains\Laboratory\Models\SectionGroup;
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
        Schema::create('section_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(SectionGroup::class)->nullable();
            $table->string('name');
            $table->string('icon')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->foreign('section_group_id')->references('id')->on('section_groups')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('section_groups');
    }
};
