<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_export_request_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_export_request_id')->constrained('stock_export_requests')->cascadeOnDelete();
            $table->foreignId('workflow_step_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('PENDING'); // ApprovalStatus enum
            $table->foreignId('acted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            // When set, this user can also act on the step (in addition to the original approver)
            $table->foreignId('delegated_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('acted_at')->nullable();
            // Computed when the approval row becomes active (step initiated)
            $table->timestamp('due_at')->nullable();
            $table->boolean('escalated')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_export_request_approvals');
    }
};
