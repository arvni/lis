<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestApproval;
use App\Domains\Inventory\Models\PurchaseRequestHistory;
use App\Domains\Inventory\Models\WorkflowStep;
use App\Domains\Inventory\Notifications\PurchaseRequestApprovedNotification;
use App\Domains\Inventory\Notifications\PurchaseRequestRejectedNotification;
use App\Domains\Inventory\Notifications\PurchaseRequestStepPendingNotification;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Spatie\Permission\Models\Role;

readonly class PurchaseRequestWorkflowService
{
    public function initiate(PurchaseRequest $pr): void
    {
        if (!$pr->workflow_template_id) return;

        $pr->approvals()->delete();

        $steps = $pr->workflowTemplate->steps;
        if ($steps->isEmpty()) return;

        foreach ($steps as $index => $step) {
            PurchaseRequestApproval::create([
                'purchase_request_id' => $pr->id,
                'workflow_step_id'    => $step->id,
                'status'              => ApprovalStatus::PENDING,
                // Only the first step is active now; set its due_at immediately
                'due_at' => $index === 0 && $step->deadline_days
                    ? now()->addDays($step->deadline_days)
                    : null,
            ]);
        }

        // Notify approvers of the first step
        $this->notifyStepApprovers($pr, $steps->first());
    }

    public function getActiveApproval(PurchaseRequest $pr, bool $lock = false): ?PurchaseRequestApproval
    {
        return PurchaseRequestApproval::where('purchase_request_id', $pr->id)
            ->where('status', ApprovalStatus::PENDING)
            ->join('workflow_steps', 'workflow_steps.id', '=', 'purchase_request_approvals.workflow_step_id')
            ->orderBy('workflow_steps.sort_order')
            ->select('purchase_request_approvals.*')
            ->with(['step.approverUser'])
            ->when($lock, fn($q) => $q->lockForUpdate())
            ->first();
    }

    public function canAct(PurchaseRequest $pr, User $user): bool
    {
        $approval = $this->getActiveApproval($pr);
        if (!$approval) return false;
        return $this->userCanActOnApproval($approval, $user);
    }

    private function userCanActOnApproval(PurchaseRequestApproval $approval, User $user): bool
    {
        if ($approval->delegated_to_user_id && $approval->delegated_to_user_id === $user->id) return true;
        return $approval->step->canBeActedBy($user);
    }

    public function delegate(PurchaseRequest $pr, User $delegator, int $delegateToUserId): void
    {
        $approval = $this->getActiveApproval($pr);
        if (!$approval) throw new RuntimeException('No active step to delegate.');
        if (!$this->userCanActOnApproval($approval, $delegator)) throw new RuntimeException('You are not the approver for this step.');

        $approval->update(['delegated_to_user_id' => $delegateToUserId]);

        $delegatee = User::findOrFail($delegateToUserId);
        $this->log($pr, 'STEP_DELEGATED', "Step \"{$approval->step->name}\" delegated to {$delegatee->name}");

        // Notify the delegatee
        $delegatee->notify(new PurchaseRequestStepPendingNotification($pr, $approval->step));
    }

    public function approveStep(PurchaseRequest $pr, User $user, ?string $notes = null): void
    {
        $notify = DB::transaction(function () use ($pr, $user, $notes) {
            $approval = $this->getActiveApproval($pr, lock: true);

            if (!$approval)
                throw new RuntimeException('No pending approval step found.');

            if (!$this->userCanActOnApproval($approval, $user))
                throw new RuntimeException('You are not authorised to approve this step.');

            $approval->update([
                'status'           => ApprovalStatus::APPROVED,
                'acted_by_user_id' => $user->id,
                'notes'            => $notes,
                'acted_at'         => now(),
            ]);

            $this->log($pr, "STEP_APPROVED", "Step: {$approval->step->name}" . ($notes ? " — {$notes}" : ''));

            $hasPending = PurchaseRequestApproval::where('purchase_request_id', $pr->id)
                ->where('status', ApprovalStatus::PENDING)
                ->exists();

            if (!$hasPending) {
                $pr->update([
                    'status'              => PurchaseRequestStatus::APPROVED->value,
                    'approved_by_user_id' => $user->id,
                ]);
                $this->log($pr, 'APPROVED');
                return ['type' => 'approved'];
            }

            $nextApproval = $this->getActiveApproval($pr);
            if ($nextApproval) {
                if ($nextApproval->step->deadline_days) {
                    $nextApproval->update(['due_at' => now()->addDays($nextApproval->step->deadline_days)]);
                }
                return ['type' => 'next_step', 'step' => $nextApproval->step];
            }

            return null;
        });

        // Send notifications after the transaction commits
        if ($notify['type'] === 'approved') {
            $pr->requestedBy->notify(new PurchaseRequestApprovedNotification($pr));
        } elseif ($notify['type'] === 'next_step') {
            $this->notifyStepApprovers($pr, $notify['step']);
        }
    }

    public function rejectStep(PurchaseRequest $pr, User $user, string $notes): void
    {
        $rejectedStep = DB::transaction(function () use ($pr, $user, $notes) {
            $approval = $this->getActiveApproval($pr, lock: true);

            if (!$approval)
                throw new RuntimeException('No pending approval step found.');

            if (!$this->userCanActOnApproval($approval, $user))
                throw new RuntimeException('You are not authorised to reject this step.');

            $step = $approval->step;

            $approval->update([
                'status'           => ApprovalStatus::REJECTED,
                'acted_by_user_id' => $user->id,
                'notes'            => $notes,
                'acted_at'         => now(),
            ]);

            PurchaseRequestApproval::where('purchase_request_id', $pr->id)
                ->where('status', ApprovalStatus::PENDING)
                ->update(['status' => ApprovalStatus::REJECTED->value]);

            $pr->update(['status' => PurchaseRequestStatus::DRAFT->value]);

            $this->log($pr, 'REJECTED', "Step: {$step->name} — {$notes}");

            return $step;
        });

        // Notify requester after transaction commits
        $pr->requestedBy->notify(new PurchaseRequestRejectedNotification($pr, $rejectedStep, $notes));
    }

    public function recall(PurchaseRequest $pr, User $user): void
    {
        if ($pr->status !== PurchaseRequestStatus::SUBMITTED)
            throw new RuntimeException('Only submitted requests can be recalled.');

        if ($pr->requested_by_user_id !== $user->id)
            throw new RuntimeException('Only the requester can recall this request.');

        DB::transaction(function () use ($pr) {
            // Re-check inside the transaction to prevent a race with an approver
            $hasActed = PurchaseRequestApproval::where('purchase_request_id', $pr->id)
                ->whereIn('status', [ApprovalStatus::APPROVED->value, ApprovalStatus::REJECTED->value])
                ->lockForUpdate()
                ->exists();

            if ($hasActed)
                throw new RuntimeException('Cannot recall: at least one step has already been acted on.');

            $pr->approvals()->delete();
            $pr->update(['status' => PurchaseRequestStatus::DRAFT->value]);
            $this->log($pr, 'RECALLED');
        });
    }

    private function notifyStepApprovers(PurchaseRequest $pr, WorkflowStep $step): void
    {
        $notification = new PurchaseRequestStepPendingNotification($pr, $step);

        if ($step->approver_user_id) {
            optional(User::find($step->approver_user_id))->notify($notification);
            return;
        }

        if ($step->approver_role) {
            $role = Role::findByName($step->approver_role, 'web');
            if ($role) {
                User::role($role)->get()->each->notify($notification);
            }
        }
    }

    private function log(PurchaseRequest $pr, string $event, ?string $notes = null): void
    {
        PurchaseRequestHistory::create([
            'purchase_request_id' => $pr->id,
            'user_id'             => auth()->id(),
            'event'               => $event,
            'notes'               => $notes,
        ]);
    }
}
