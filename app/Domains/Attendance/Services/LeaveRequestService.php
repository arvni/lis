<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\Adapters\UserAdapter;
use App\Domains\Attendance\Adapters\WorkflowAdapter;
use App\Domains\Attendance\DTOs\LeaveRequestDTO;
use App\Domains\Attendance\Enums\LeaveApprovalStatus;
use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Events\AttendanceRebuildRequested;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Models\LeaveRequestApproval;
use App\Domains\Attendance\Notifications\LeaveRequestAwaitingApprovalNotification;
use App\Domains\Attendance\Notifications\LeaveRequestDecidedNotification;
use App\Domains\Attendance\Repositories\LeaveRequestRepository;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use RuntimeException;

/**
 * Leave requests from submission to decision.
 *
 * A request's approval steps come from the leave workflow template matching the roles of the person
 * taking the leave (Inventory → Workflow Templates), copied onto the request so a later template edit
 * doesn't change requests already under way. Without a matching template, anyone who can manage leave
 * requests approves it. Steps are approved in order, nobody approves their own leave, and a rejection
 * is final.
 */
class LeaveRequestService
{
    public const MANAGE_PERMISSION = 'Attendance.Leave Requests.Manage Leave Requests';

    public const FALLBACK_STEP = 'Leave manager approval';

    public function __construct(
        private readonly LeaveRequestRepository $leaveRepository,
        private readonly WorkflowAdapter $workflowAdapter,
        private readonly UserAdapter $userAdapter,
    ) {}

    public function isLeaveManager(User $user): bool
    {
        return $user->can(self::MANAGE_PERMISSION);
    }

    /**
     * `filters.scope`: "mine" (default: leave the viewer takes or entered), "approvals" (waiting for the
     * viewer's approval) or "all" (leave managers only; anyone else gets "mine").
     *
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, LeaveRequest>
     */
    public function listRequests(array $queryData, User $viewer): LengthAwarePaginator
    {
        $scope = $queryData['filters']['scope'] ?? 'mine';

        if ($scope === 'approvals') {
            return $this->leaveRepository->listAwaiting(
                $queryData,
                $viewer->id,
                array_values($viewer->getRoleNames()->all()),
                $this->isLeaveManager($viewer),
            );
        }

        if ($scope === 'all' && $this->isLeaveManager($viewer)) {
            return $this->leaveRepository->listAll($queryData);
        }

        return $this->leaveRepository->listForUser($queryData, $viewer->id);
    }

    /**
     * @return Collection<int, User>
     */
    public function searchPeople(?string $search): Collection
    {
        return $this->userAdapter->searchActiveUsers($search);
    }

    /**
     * @throws RuntimeException when the person already has leave waiting or approved at that time
     */
    public function submit(LeaveRequestDTO $dto, User $submitter): LeaveRequest
    {
        $person = $dto->userId === $submitter->id ? $submitter : $this->userAdapter->findUserOrFail($dto->userId);

        foreach ($this->leaveRepository->activeOnDates($person->id, $dto->startDate, $dto->endDate) as $other) {
            if ($this->clashes($other, $dto)) {
                throw new RuntimeException("{$person->name} already has leave waiting for approval or approved at that time.");
            }
        }

        $workflow = $this->workflowAdapter->leaveWorkflowFor($person);
        $steps = $workflow['steps'] ?? [];
        if ($steps === []) {
            $steps = [['name' => self::FALLBACK_STEP, 'approver_role' => null, 'approver_user_id' => null, 'deadline_days' => null]];
        }

        $leave = DB::transaction(function () use ($dto, $submitter, $workflow, $steps) {
            $leave = $this->leaveRepository->create([
                ...$dto->toArray(),
                'requested_by' => $submitter->id,
                'status' => LeaveRequestStatus::PENDING,
                'workflow_template_id' => $workflow['template_id'] ?? null,
            ]);

            $approvals = [];
            foreach ($steps as $index => $step) {
                $approvals[] = [
                    'sort_order' => $index,
                    'name' => $step['name'],
                    'approver_role' => $step['approver_role'],
                    'approver_user_id' => $step['approver_user_id'],
                    'deadline_days' => $step['deadline_days'],
                    'status' => LeaveApprovalStatus::PENDING,
                    // Only the first step is running yet, so only it has a due date.
                    'due_at' => $index === 0 && $step['deadline_days'] ? Carbon::now()->addDays($step['deadline_days']) : null,
                ];
            }
            $this->leaveRepository->createApprovals($leave, $approvals);

            return $leave;
        });

        $this->notifyCurrentApprovers($leave);

        return $leave;
    }

    /** Whether the person can approve or reject the request's current step right now. */
    public function canAct(LeaveRequest $leave, User $user): bool
    {
        if ($leave->status !== LeaveRequestStatus::PENDING || $leave->user_id === $user->id) {
            return false;
        }

        $current = $this->currentStep($leave);

        return $current !== null && $this->isApproverOf($current, $user);
    }

    /** Whether the person approves, or approved, any step of the request. */
    public function isApprover(LeaveRequest $leave, User $user): bool
    {
        return $leave->approvals->contains(
            fn (LeaveRequestApproval $approval) => $approval->acted_by === $user->id || $this->isApproverOf($approval, $user)
        );
    }

    public function canCancel(LeaveRequest $leave, User $user): bool
    {
        $isOwner = $leave->user_id === $user->id || $leave->requested_by === $user->id;

        return match ($leave->status) {
            LeaveRequestStatus::PENDING => $isOwner || $this->isLeaveManager($user),
            // Once approved leave has started, only a leave manager can take it back.
            LeaveRequestStatus::APPROVED => $this->isLeaveManager($user)
                || ($isOwner && $leave->start_date->gt(Carbon::today())),
            default => false,
        };
    }

    /**
     * Approve the current step; approving the last step approves the leave.
     *
     * @throws RuntimeException when the request isn't waiting for this person
     */
    public function approve(LeaveRequest $leave, User $approver, ?string $notes): void
    {
        $approved = DB::transaction(function () use ($leave, $approver, $notes) {
            $locked = $this->leaveRepository->lock($leave);
            $current = $this->currentStep($locked);
            if ($current === null || ! $this->canAct($locked, $approver)) {
                throw new RuntimeException($this->refusal($locked, $approver));
            }

            $this->leaveRepository->updateApproval($current, [
                'status' => LeaveApprovalStatus::APPROVED,
                'acted_by' => $approver->id,
                'notes' => $notes,
                'acted_at' => Carbon::now(),
            ]);

            $next = $this->currentStep($locked);
            if ($next === null) {
                $this->leaveRepository->update($locked, ['status' => LeaveRequestStatus::APPROVED, 'decided_at' => Carbon::now()]);

                return true;
            }

            if ($next->deadline_days) {
                $this->leaveRepository->updateApproval($next, ['due_at' => Carbon::now()->addDays($next->deadline_days)]);
            }

            return false;
        });

        $leave->refresh();

        if ($approved) {
            $this->recalculateAttendance($leave);
            $this->notifyDecision($leave, $approver);
        } else {
            $this->notifyCurrentApprovers($leave);
        }
    }

    /**
     * Reject the request at its current step. Final: the remaining steps are never reached.
     *
     * @throws RuntimeException when the request isn't waiting for this person
     */
    public function reject(LeaveRequest $leave, User $approver, string $notes): void
    {
        DB::transaction(function () use ($leave, $approver, $notes) {
            $locked = $this->leaveRepository->lock($leave);
            $current = $this->currentStep($locked);
            if ($current === null || ! $this->canAct($locked, $approver)) {
                throw new RuntimeException($this->refusal($locked, $approver));
            }

            $this->leaveRepository->updateApproval($current, [
                'status' => LeaveApprovalStatus::REJECTED,
                'acted_by' => $approver->id,
                'notes' => $notes,
                'acted_at' => Carbon::now(),
            ]);
            $this->leaveRepository->skipPendingApprovals($locked);
            $this->leaveRepository->update($locked, ['status' => LeaveRequestStatus::REJECTED, 'decided_at' => Carbon::now()]);
        });

        $leave->refresh();
        $this->notifyDecision($leave, $approver);
    }

    /**
     * @throws RuntimeException when the person may not cancel it (any more)
     */
    public function cancel(LeaveRequest $leave, User $user, ?string $reason): void
    {
        $wasApproved = DB::transaction(function () use ($leave, $user, $reason) {
            $locked = $this->leaveRepository->lock($leave);
            if (! $this->canCancel($locked, $user)) {
                throw new RuntimeException($this->cancelRefusal($locked, $user));
            }

            $wasApproved = $locked->status === LeaveRequestStatus::APPROVED;
            $this->leaveRepository->skipPendingApprovals($locked);
            $this->leaveRepository->update($locked, [
                'status' => LeaveRequestStatus::CANCELLED,
                'cancelled_by' => $user->id,
                'cancelled_at' => Carbon::now(),
                'cancel_reason' => $reason,
            ]);

            return $wasApproved;
        });

        $leave->refresh();

        if ($wasApproved) {
            $this->recalculateAttendance($leave);
        }
        $this->notifyDecision($leave, $user);
    }

    private function currentStep(LeaveRequest $leave): ?LeaveRequestApproval
    {
        return $leave->approvals
            ->sortBy('sort_order')
            ->first(fn (LeaveRequestApproval $approval) => $approval->status === LeaveApprovalStatus::PENDING);
    }

    private function isApproverOf(LeaveRequestApproval $approval, User $user): bool
    {
        if ($approval->approver_user_id !== null) {
            return $approval->approver_user_id === $user->id;
        }
        if ($approval->approver_role !== null) {
            return $user->hasRole($approval->approver_role);
        }

        return $this->isLeaveManager($user);
    }

    /** The dates already overlap; only two hourly leaves on the same day can sit side by side. */
    private function clashes(LeaveRequest $existing, LeaveRequestDTO $dto): bool
    {
        if ($existing->type === LeaveType::DAILY || $dto->type === LeaveType::DAILY) {
            return true;
        }

        return substr((string) $existing->start_time, 0, 5) < (string) $dto->endTime
            && substr((string) $existing->end_time, 0, 5) > (string) $dto->startTime;
    }

    private function refusal(LeaveRequest $leave, User $user): string
    {
        return match (true) {
            $leave->status !== LeaveRequestStatus::PENDING => 'This leave request has already been '.strtolower($leave->status->label()).'.',
            $leave->user_id === $user->id => 'Nobody can approve their own leave.',
            default => 'This leave request is not waiting for your approval.',
        };
    }

    private function cancelRefusal(LeaveRequest $leave, User $user): string
    {
        $isOwner = $leave->user_id === $user->id || $leave->requested_by === $user->id;

        return $leave->status === LeaveRequestStatus::APPROVED && $isOwner
            ? 'This leave has already started. Ask a leave manager to cancel it.'
            : 'This leave request can no longer be cancelled.';
    }

    /** Past days already judged without this leave (or with it) are recalculated. */
    private function recalculateAttendance(LeaveRequest $leave): void
    {
        $today = Carbon::today();
        if ($leave->start_date->gt($today)) {
            return;
        }

        $to = $leave->end_date->lt($today) ? $leave->end_date : $today;
        AttendanceRebuildRequested::dispatch($leave->start_date->toDateString(), $to->toDateString(), [$leave->user_id]);
    }

    private function notifyCurrentApprovers(LeaveRequest $leave): void
    {
        $this->leaveRepository->loadDetails($leave);
        $current = $this->currentStep($leave);
        if ($current === null) {
            return;
        }

        $recipients = $this->approversOf($current)->reject(fn (User $user) => $user->id === $leave->user_id);
        Notification::send($recipients, new LeaveRequestAwaitingApprovalNotification($leave, $current->name));
    }

    /**
     * Tell the person taking the leave, and whoever entered it for them, unless they made the decision.
     */
    private function notifyDecision(LeaveRequest $leave, User $decidedBy): void
    {
        $this->leaveRepository->loadDetails($leave);

        $recipients = [];
        foreach ([$leave->user, $leave->requestedBy] as $recipient) {
            if ($recipient !== null && $recipient->id !== $decidedBy->id) {
                $recipients[$recipient->id] = $recipient;
            }
        }

        Notification::send(array_values($recipients), new LeaveRequestDecidedNotification($leave));
    }

    /**
     * @return Collection<int, User>
     */
    private function approversOf(LeaveRequestApproval $approval): Collection
    {
        if ($approval->approver_user_id !== null) {
            $user = $this->userAdapter->findUser($approval->approver_user_id);

            return new Collection($user ? [$user] : []);
        }

        if ($approval->approver_role !== null) {
            return $this->userAdapter->getUsersWithRole($approval->approver_role);
        }

        return $this->userAdapter->getUsersWithPermission(self::MANAGE_PERMISSION);
    }
}
