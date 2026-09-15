<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

use App\Domains\Attendance\Models\LeaveRequest;

/**
 * One leave request's working days (full-day leave) or minutes (hourly leave) inside a year, split at
 * today: the part on or before today and the part after it.
 */
final readonly class CountedLeave
{
    public function __construct(
        public LeaveRequest $leave,
        public int $pastDays,
        public int $pastMinutes,
        public int $futureDays,
        public int $futureMinutes,
    ) {}

    public function days(): int
    {
        return $this->pastDays + $this->futureDays;
    }

    public function minutes(): int
    {
        return $this->pastMinutes + $this->futureMinutes;
    }
}
