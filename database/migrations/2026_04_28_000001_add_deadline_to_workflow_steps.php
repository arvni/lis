<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_steps', function (Blueprint $table) {
            // Max working days allowed for this step. null = no deadline.
            $table->unsignedTinyInteger('deadline_days')->nullable()->after('sort_order');
        });

        Schema::table('purchase_request_approvals', function (Blueprint $table) {
            // Computed when the approval row becomes active (step initiated)
            $table->timestamp('due_at')->nullable()->after('acted_at');
            $table->boolean('escalated')->default(false)->after('due_at');
        });
    }

    public function down(): void
    {
        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->dropColumn('deadline_days');
        });
        Schema::table('purchase_request_approvals', function (Blueprint $table) {
            $table->dropColumn(['due_at', 'escalated']);
        });
    }
};
