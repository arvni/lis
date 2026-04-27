<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_templates', function (Blueprint $table) {
            // conditions: {"urgencies": ["NORMAL","HIGH"], "requester_roles": ["Lab Staff"]}
            // null/empty array on either key = matches any value for that condition
            $table->json('conditions')->nullable()->after('is_default');
            // Lower number = evaluated first. First matching template wins.
            $table->unsignedSmallInteger('priority')->default(0)->after('conditions');
        });

        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('workflow_template_id');
        });

        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->foreignId('workflow_template_id')
                ->nullable()
                ->after('status')
                ->constrained('workflow_templates')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('workflow_templates', function (Blueprint $table) {
            $table->dropColumn(['conditions', 'priority']);
        });
    }
};
