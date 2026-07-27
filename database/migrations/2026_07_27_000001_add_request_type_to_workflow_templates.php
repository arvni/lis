<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_templates', function (Blueprint $table) {
            // NULL = applies to both purchase and export requests.
            $table->string('request_type')->nullable()->after('is_default')->index();
        });
    }

    public function down(): void
    {
        Schema::table('workflow_templates', function (Blueprint $table) {
            $table->dropIndex(['request_type']);
            $table->dropColumn('request_type');
        });
    }
};
