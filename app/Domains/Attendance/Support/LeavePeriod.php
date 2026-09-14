<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Support;

use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\LeaveRequest;

/**
 * The dates and times a leave request covers, as people read them in notifications.
 */
final class LeavePeriod
{
    public static function describe(LeaveRequest $leave): string
    {
        $start = $leave->start_date->format('Y-m-d');

        if ($leave->type === LeaveType::HOURLY) {
            return $start.' '.substr((string) $leave->start_time, 0, 5).'–'.substr((string) $leave->end_time, 0, 5);
        }

        $end = $leave->end_date->format('Y-m-d');

        return $start === $end ? $start : "$start to $end";
    }
}
