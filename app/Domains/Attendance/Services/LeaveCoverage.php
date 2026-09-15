<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\DTOs\TimeRange;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\LeaveRequest;
use Illuminate\Support\Carbon;

/**
 * Which parts of a working day approved leave excuses. Pure: no database.
 */
class LeaveCoverage
{
    /**
     * @param  iterable<LeaveRequest>  $leaves  one person's approved leave
     * @return list<TimeRange> the excused parts, inside the shift hours
     */
    public function excusedOn(iterable $leaves, Carbon $date, ShiftHours $hours): array
    {
        $day = $date->copy()->startOfDay();
        $start = $day->copy()->setTimeFromTimeString($hours->start);
        $end = $day->copy()->setTimeFromTimeString($hours->end);

        $ranges = [];
        foreach ($leaves as $leave) {
            if ($day->lt($leave->start_date) || $day->gt($leave->end_date)) {
                continue;
            }

            if ($leave->type === LeaveType::DAILY) {
                $ranges[] = new TimeRange($start->copy(), $end->copy());

                continue;
            }

            $from = $day->copy()->setTimeFromTimeString((string) $leave->start_time);
            $to = $day->copy()->setTimeFromTimeString((string) $leave->end_time);
            $from = $from->lt($start) ? $start->copy() : $from;
            $to = $to->gt($end) ? $end->copy() : $to;

            if ($from->lt($to)) {
                $ranges[] = new TimeRange($from, $to);
            }
        }

        return $ranges;
    }
}
