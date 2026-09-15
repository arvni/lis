<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Policies;

use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\User\Models\User;

class LeaveKindPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Attendance.Leave Kinds.List Leave Kinds');
    }

    public function create(User $user): bool
    {
        return $user->can('Attendance.Leave Kinds.Manage Leave Kinds');
    }

    public function update(User $user, LeaveKind $kind): bool
    {
        return $user->can('Attendance.Leave Kinds.Manage Leave Kinds');
    }

    public function delete(User $user, LeaveKind $kind): bool
    {
        return $user->can('Attendance.Leave Kinds.Manage Leave Kinds');
    }
}
