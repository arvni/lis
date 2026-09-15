<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Policies;

use App\Domains\Attendance\Models\Shift;
use App\Domains\User\Models\User;

class ShiftPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Attendance.Shifts.List Shifts');
    }

    public function create(User $user): bool
    {
        return $user->can('Attendance.Shifts.Create Shift');
    }

    public function update(User $user, Shift $shift): bool
    {
        return $user->can('Attendance.Shifts.Edit Shift');
    }

    public function delete(User $user, Shift $shift): bool
    {
        return $user->can('Attendance.Shifts.Delete Shift');
    }
}
