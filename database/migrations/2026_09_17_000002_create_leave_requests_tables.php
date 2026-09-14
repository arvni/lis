<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            // The person taking the leave.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Who entered it: the person themselves, or a leave manager on their behalf.
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('leave_kind_id')->constrained()->restrictOnDelete();
            // DAILY: every working day from start_date to end_date. HOURLY: start_time..end_time on start_date.
            $table->string('type', 10);
            $table->date('start_date');
            $table->date('end_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->text('reason')->nullable();
            $table->string('status', 12);
            // The Inventory workflow template the steps were copied from; kept for reference only.
            $table->unsignedBigInteger('workflow_template_id')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancel_reason', 500)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'start_date']);
            $table->index(['status', 'start_date']);
        });

        // The approval steps of one request, copied from its workflow template when it was submitted so a
        // later template edit doesn't change a request already under way. A step with neither an approver
        // role nor an approver user is approved by anyone who can manage leave requests.
        Schema::create('leave_request_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_request_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order');
            $table->string('name');
            $table->string('approver_role')->nullable();
            $table->foreignId('approver_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('deadline_days')->nullable();
            $table->string('status', 10);
            $table->foreignId('acted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('notes', 500)->nullable();
            $table->timestamp('acted_at')->nullable();
            // Set when the step becomes the current one.
            $table->timestamp('due_at')->nullable();
            $table->timestamps();

            $table->index(['leave_request_id', 'sort_order']);
            $table->index(['status', 'approver_role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_request_approvals');
        Schema::dropIfExists('leave_requests');
    }
};
