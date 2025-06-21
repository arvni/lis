<?php

use App\Domains\Laboratory\Models\RequestForm;
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
            if (!Schema::hasColumn('tests', 'form_id'))
                $table->foreignIdFor(RequestForm::class)->after('id')->nullable();
            $table->foreign('request_form_id')->references('id')->on('request_forms')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            if (Schema::hasColumn('tests', 'form_id'))
                $table->dropConstrainedForeignIdFor(RequestForm::class);
        });
    }
};
