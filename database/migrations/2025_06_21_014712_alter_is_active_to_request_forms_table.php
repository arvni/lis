<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('request_forms', function (Blueprint $table) {
            if (!Schema::hasColumn('request_forms', 'form_Data'))
                $table->renameColumn('formData', 'form_data');
            if (!Schema::hasColumn('request_forms', 'is_active'))
                $table->boolean('is_active')->default(true)->after('form_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('request_forms', function (Blueprint $table) {
            if (Schema::hasColumn('request_forms', 'is_active'))
                $table->dropColumn('is_active');
            if (Schema::hasColumn('request_forms', 'form_Data'))
                $table->renameColumn('form_data', 'formData');
        });
    }
};
