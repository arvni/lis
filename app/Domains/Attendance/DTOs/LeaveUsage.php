<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

/**
 * One person's leave in a calendar year: per kind, in total, and request by request.
 */
final readonly class LeaveUsage
{
    /**
     * @param  list<LeaveUsageLine>  $kinds  by kind name
     * @param  list<CountedLeave>  $requests  approved and pending requests touching the year, by start date
     */
    public function __construct(
        public int $year,
        public array $kinds,
        public LeaveUsageLine $total,
        public array $requests,
    ) {}
}
