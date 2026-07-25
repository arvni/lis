<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Adapters\UserAdapter;
use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\Inventory\Enums\StockExportRequestStatus;
use App\Domains\Inventory\Models\StockExportRequest;
use App\Domains\Inventory\Models\StockExportRequestApproval;
use App\Domains\Inventory\Models\WorkflowStep;
use App\Domains\Inventory\Notifications\StockExportRequestApprovedNotification;
use App\Domains\Inventory\Notifications\StockExportRequestRejectedNotification;
use App\Domains\Inventory\Notifications\StockExportRequestStepPendingNotification;
use App\Domains\Inventory\Repositories\StockExportRequestApprovalRepository;
use App\Domains\Inventory\Repositories\StockExportRequestRepository;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class StockExportRequestWorkflowService
{
    public function __construct(
        private readonly StockExportRequestRepository $exportRequestRepository,
        private readonly StockExportRequestApprovalRepository $approvalRepository,
        private readonly UserAdapter $userAdapter,
    ) {}

    public function initiate(StockExportRequest $request): void
    {
        if (! $request->workflow_template_id) {
            return;
        }

        $this->approvalRepository->deleteForRequest($request);

        $steps = $request->workflowTemplate->steps;
        if ($steps->isEmpty()) {
            return;
        }

        foreach ($steps as $index => $step) {
            $this->approvalRepository->create([
                'stock_export_request_id' => $request->id,
                'workflow_step_id' => $step->id,
                'status' => ApprovalStatus::PENDING,
                // Only the first step is active now; set its due_at immediately
                'due_at' => $index === 0 && $step->deadline_days
                    ? now()->addDays($step->deadline_days)
                    : null,
            ]);
        }

        // Notify approvers of the first step
        $this->notifyStepApprovers($request, $steps->first());
    }

    public function getActiveApproval(StockExportRequest $request, bool $lock = false): ?StockExportRequestApproval
    {
        return $this->approvalRepository->findActiveForRequest($request, $lock);
    }

    public function canAct(StockExportRequest $request, User $user): bool
    {
        $approval = $this->getActiveApproval($request);
        if (! $approval) {
            return false;
        }

        return $this->userCanActOnApproval($approval, $user);
    }

    private function userCanActOnApproval(StockExportRequestApproval $approval, User $user): bool
    {
        if ($approval->delegated_to_user_id && $approval->delegated_to_user_id === $user->id) {
            return true;
        }

        return $approval->step->canBeActedBy($user);
    }

    public function delegate(StockExportRequest $request, User $delegator, int $delegateToUserId): void
    {
        $approval = $this->getActiveApproval($request);
        if (! $approval) {
            throw new RuntimeException('No active step to delegate.');
        }
        if (! $this->userCanActOnApproval($approval, $delegator)) {
            throw new RuntimeException('You are not the approver for this step.');
        }

        $approval->update(['delegated_to_user_id' => $delegateToUserId]);

        $delegatee = $this->userAdapter->findUserOrFail($delegateToUserId);
        $this->log($request, 'STEP_DELEGATED', "Step \"{$approval->step->name}\" delegated to {$delegatee->name}");

        // Notify the delegatee
        $delegatee->notify(new StockExportRequestStepPendingNotification($request, $approval->step));
    }

    public function approveStep(StockExportRequest $request, User $user, ?string $notes = null): void
    {
        $notify = DB::transaction(function () use ($request, $user, $notes) {
            $approval = $this->getActiveApproval($request, lock: true);

            if (! $approval) {
                throw new RuntimeException('No pending approval step found.');
            }

            if (! $this->userCanActOnApproval($approval, $user)) {
                throw new RuntimeException('You are not authorised to approve this step.');
            }

            $approval->update([
                'status' => ApprovalStatus::APPROVED,
                'acted_by_user_id' => $user->id,
                'notes' => $notes,
                'acted_at' => now(),
            ]);

            $this->log($request, 'STEP_APPROVED', "Step: {$approval->step->name}".($notes ? " — {$notes}" : ''));

            if (! $this->approvalRepository->hasPendingForRequest($request)) {
                $request->update([
                    'status' => StockExportRequestStatus::APPROVED->value,
                    'approved_by_user_id' => $user->id,
                ]);
                $this->log($request, 'APPROVED');

                return ['type' => 'approved'];
            }

            $nextApproval = $this->getActiveApproval($request);
            if ($nextApproval) {
                if ($nextApproval->step->deadline_days) {
                    $nextApproval->update(['due_at' => now()->addDays($nextApproval->step->deadline_days)]);
                }

                return ['type' => 'next_step', 'step' => $nextApproval->step];
            }

            return null;
        });

        // Send notifications after the transaction commits ($notify is null when the
        // active step vanished mid-flight — nothing to notify in that case)
        if ($notify !== null) {
            if ($notify['type'] === 'approved') {
                $request->requestedBy->notify(new StockExportRequestApprovedNotification($request));
            } else {
                $this->notifyStepApprovers($request, $notify['step']);
            }
        }
    }

    public function rejectStep(StockExportRequest $request, User $user, string $notes): void
    {
        $rejectedStep = DB::transaction(function () use ($request, $user, $notes) {
            $approval = $this->getActiveApproval($request, lock: true);

            if (! $approval) {
                throw new RuntimeException('No pending approval step found.');
            }

            if (! $this->userCanActOnApproval($approval, $user)) {
                throw new RuntimeException('You are not authorised to reject this step.');
            }

            $step = $approval->step;

            $approval->update([
                'status' => ApprovalStatus::REJECTED,
                'acted_by_user_id' => $user->id,
                'notes' => $notes,
                'acted_at' => now(),
            ]);

            $this->approvalRepository->rejectAllPending($request);

            $request->update(['status' => StockExportRequestStatus::DRAFT->value]);

            $this->log($request, 'REJECTED', "Step: {$step->name} — {$notes}");

            return $step;
        });

        // Notify requester after transaction commits
        $request->requestedBy->notify(new StockExportRequestRejectedNotification($request, $rejectedStep, $notes));
    }

    public function recall(StockExportRequest $request, User $user): void
    {
        if ($request->status !== StockExportRequestStatus::SUBMITTED) {
            throw new RuntimeException('Only submitted requests can be recalled.');
        }

        if ($request->requested_by_user_id !== $user->id) {
            throw new RuntimeException('Only the requester can recall this request.');
        }

        DB::transaction(function () use ($request) {
            // Re-check inside the transaction to prevent a race with an approver
            if ($this->approvalRepository->hasActedSteps($request)) {
                throw new RuntimeException('Cannot recall: at least one step has already been acted on.');
            }

            $this->approvalRepository->deleteForRequest($request);
            $request->update(['status' => StockExportRequestStatus::DRAFT->value]);
            $this->log($request, 'RECALLED');
        });
    }

    private function notifyStepApprovers(StockExportRequest $request, WorkflowStep $step): void
    {
        $notification = new StockExportRequestStepPendingNotification($request, $step);

        if ($step->approver_user_id) {
            optional($this->userAdapter->findUser($step->approver_user_id))->notify($notification);

            return;
        }

        if ($step->approver_role) {
            $this->userAdapter->getUsersWithRole($step->approver_role)->each->notify($notification);
        }
    }

    private function log(StockExportRequest $request, string $event, ?string $notes = null): void
    {
        $this->exportRequestRepository->createHistory([
            'stock_export_request_id' => $request->id,
            'user_id' => auth()->id(),
            'event' => $event,
            'notes' => $notes,
        ]);
    }
}
