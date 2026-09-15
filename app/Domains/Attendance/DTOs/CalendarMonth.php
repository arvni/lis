<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

use Illuminate\Support\Carbon;

/**
 * One person's attendance calendar for a month, with the month's totals.
 */
final readonly class CalendarMonth
{
    /**
     * @param  Carbon  $month  the first day of the month
     * @param  list<CalendarDay>  $days  every day of the month, in order
     * @param  array{scheduled_minutes: int, worked_minutes: int, late_minutes: int, early_leave_minutes: int, leave_minutes: int, present_days: int, absent_days: int, leave_days: int, corrected_days: int}  $totals
     */
    public function __construct(
        public Carbon $month,
        public array $days,
        public array $totals,
    ) {}
}
