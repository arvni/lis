<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Policies;

use App\Domains\Attendance\Models\UserShift;
use App\Domains\User\Models\User;

class UserShiftPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Attendance.Shift Assignments.Manage Shift Assignments');
    }

    public function create(User $user): bool
    {
        return $user->can('Attendance.Shift Assignments.Manage Shift Assignments');
    }

    public function delete(User $user, UserShift $assignment): bool
    {
        return $user->can('Attendance.Shift Assignments.Manage Shift Assignments');
    }
}
