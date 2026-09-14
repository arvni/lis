<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

/**
 * One weekday's working hours, as "H:i" or "H:i:s". The start is always before the end.
 */
final readonly class ShiftHours
{
    public function __construct(
        public string $start,
        public string $end,
    ) {}
}
