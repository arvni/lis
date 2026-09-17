<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

/**
 * One person's leave over a period: per kind, in total, and request by request. The period is
 * usually a calendar year, but a contract's duration is asked for just as often.
 */
final readonly class LeaveUsage
{
    /**
     * @param  string  $from  first day of the period, Y-m-d
     * @param  string  $to  last day of the period, Y-m-d
     * @param  list<LeaveUsageLine>  $kinds  by kind name
     * @param  list<CountedLeave>  $requests  approved and pending requests touching the period, by start date
     */
    public function __construct(
        public string $from,
        public string $to,
        public array $kinds,
        public LeaveUsageLine $total,
        public array $requests,
    ) {}
}
