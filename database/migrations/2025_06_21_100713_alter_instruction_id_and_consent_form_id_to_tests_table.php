<?php

use App\Domains\Laboratory\Models\ConsentForm;
use App\Domains\Laboratory\Models\Instruction;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            if (!Schema::hasColumn('tests', 'consent_form_id')) {
                $table->foreignIdFor(ConsentForm::class)->after('id')->nullable();
                $table->foreign('consent_form_id')->references('id')->on('consent_forms')->nullOnDelete();
            }
            if (!Schema::hasColumn('tests', 'instruction_id')) {
                $table->foreignIdFor(Instruction::class)->after('consent_form_id')->nullable();
                $table->foreign('instruction_id')->references('id')->on('instructions')->nullOnDelete();
            }

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            if (Schema::hasColumn('tests', 'consent_form_id'))
                $table->dropConstrainedForeignIdFor(ConsentForm::class);
            if (Schema::hasColumn('tests', 'instruction_id'))
                $table->dropConstrainedForeignIdFor(Instruction::class);
        });
    }
};
