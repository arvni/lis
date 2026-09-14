<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\ShiftDay;
use App\Domains\Attendance\Models\UserShift;
use Illuminate\Support\Carbon;

/**
 * Which shift, and which hours, apply to a person on a date. Pure: works on loaded assignments.
 */
class ShiftSchedule
{
    /**
     * @param  iterable<UserShift>  $assignments  one person's assignments
     */
    public function assignmentOn(iterable $assignments, Carbon $date): ?UserShift
    {
        foreach ($assignments as $assignment) {
            if ($assignment->effective_from->lte($date)
                && ($assignment->effective_to === null || $assignment->effective_to->gte($date))) {
                return $assignment;
            }
        }

        return null;
    }

    /** The shift's hours on that weekday; null on a day off. */
    public function hoursOn(Shift $shift, Carbon $date): ?ShiftHours
    {
        $day = $shift->days->first(fn (ShiftDay $shiftDay) => $shiftDay->weekday->value === $date->dayOfWeek);

        return $day ? new ShiftHours($day->start_time, $day->end_time) : null;
    }

    /** Whole minutes from the start to the end of the hours. */
    public function minutesOf(ShiftHours $hours): int
    {
        [$startHour, $startMinute] = array_map('intval', explode(':', $hours->start));
        [$endHour, $endMinute] = array_map('intval', explode(':', $hours->end));

        return max(0, ($endHour * 60 + $endMinute) - ($startHour * 60 + $startMinute));
    }
}
