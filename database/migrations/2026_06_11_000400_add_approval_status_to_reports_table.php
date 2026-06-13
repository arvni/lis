<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('approval_status')->default('pending')->after('status');
            $table->unsignedInteger('current_step_position')->nullable()->after('approval_status');
        });

        // Backfill from the legacy single-approver columns.
        DB::table('reports')
            ->where('status', false)
            ->update(['approval_status' => 'rejected']);

        DB::table('reports')
            ->where('status', true)
            ->whereNotNull('approved_at')
            ->whereNotNull('approver_id')
            ->update(['approval_status' => 'approved']);

        // Preserve legacy approvals/rejections in the audit trail
        // (approval_flow_step_id stays null for pre-workflow records).
        DB::table('reports')
            ->whereNotNull('approver_id')
            ->whereNotNull('approved_at')
            ->orderBy('id')
            ->each(function ($report) {
                DB::table('report_approvals')->insert([
                    'report_id' => $report->id,
                    'approval_flow_step_id' => null,
                    'user_id' => $report->approver_id,
                    'action' => $report->status ? 'approved' : 'rejected',
                    'comment' => $report->status ? null : $report->comment,
                    'created_at' => $report->approved_at,
                    'updated_at' => $report->approved_at,
                ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['approval_status', 'current_step_position']);
        });
    }
};
