<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Policies;

use App\Domains\Attendance\Models\Holiday;
use App\Domains\User\Models\User;

class HolidayPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Attendance.Holidays.List Holidays');
    }

    public function create(User $user): bool
    {
        return $user->can('Attendance.Holidays.Create Holiday');
    }

    public function update(User $user, Holiday $holiday): bool
    {
        return $user->can('Attendance.Holidays.Edit Holiday');
    }

    public function delete(User $user, Holiday $holiday): bool
    {
        return $user->can('Attendance.Holidays.Delete Holiday');
    }
}
