<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Models\AttendanceDayChange;
use App\Domains\Attendance\Models\Holiday;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Models\UserShift;
use Illuminate\Support\Carbon;

/**
 * Everything about one person's day on the attendance calendar: what was planned and what happened.
 */
final readonly class CalendarDay
{
    /**
     * @param  list<LeaveRequest>  $leaves  pending or approved leave touching the day
     * @param  int  $scheduledMinutes  working time planned by the shift; 0 on days off and holidays
     * @param  list<AttendanceDayChange>  $changes  hand edits of the day, newest first
     */
    public function __construct(
        public Carbon $date,
        public ?UserShift $assignment,
        public ?ShiftHours $hours,
        public ?Holiday $holiday,
        public array $leaves,
        public ?AttendanceDay $record,
        public int $scheduledMinutes,
        public array $changes = [],
    ) {}
}
