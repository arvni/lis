<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Policies;

use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Services\LeaveRequestService;
use App\Domains\User\Models\User;

class LeaveRequestPolicy
{
    public function __construct(private readonly LeaveRequestService $leaveService) {}

    /** Everyone sees their own leave requests. */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, LeaveRequest $leave): bool
    {
        return $leave->user_id === $user->id
            || $leave->requested_by === $user->id
            || $this->leaveService->isLeaveManager($user)
            || $this->leaveService->isApprover($leave, $user);
    }

    /** Everyone who can sign in can ask for leave for themselves. */
    public function create(User $user): bool
    {
        return true;
    }

    public function createForOthers(User $user): bool
    {
        return $this->leaveService->isLeaveManager($user);
    }

    /** Leave managers see how much leave anyone has used; everyone else only their own. */
    public function viewUsageOfOthers(User $user): bool
    {
        return $this->leaveService->isLeaveManager($user);
    }

    public function approve(User $user, LeaveRequest $leave): bool
    {
        return $this->leaveService->canAct($leave, $user);
    }

    public function cancel(User $user, LeaveRequest $leave): bool
    {
        return $this->leaveService->canCancel($leave, $user);
    }
}
