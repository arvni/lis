<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Policies;

use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\User\Models\User;

class AttendanceDayPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Attendance.Daily Attendance.List Attendance');
    }

    public function update(User $user, AttendanceDay $day): bool
    {
        return $this->correct($user);
    }

    /** Whether the person may correct recorded days at all (e.g. to offer the action on the calendar). */
    public function correct(User $user): bool
    {
        return $user->can('Attendance.Daily Attendance.Correct Attendance');
    }

    public function export(User $user): bool
    {
        return $user->can('Attendance.Daily Attendance.Export Attendance');
    }
}
