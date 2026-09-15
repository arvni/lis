<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

/**
 * Leave used of one kind (or all kinds together): working days of full-day leave and minutes of
 * hourly leave, taken so far, booked for later and still waiting for approval.
 */
final readonly class LeaveUsageLine
{
    /**
     * @param  int|null  $kindId  null for the total of all kinds
     */
    public function __construct(
        public ?int $kindId,
        public string $kindName,
        public int $takenDays,
        public int $takenMinutes,
        public int $bookedDays,
        public int $bookedMinutes,
        public int $pendingDays,
        public int $pendingMinutes,
    ) {}
}
