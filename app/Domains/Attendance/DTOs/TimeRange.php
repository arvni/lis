<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

use Illuminate\Support\Carbon;

/**
 * A stretch of time on one day, e.g. an approved hourly leave the person is excused for.
 */
final readonly class TimeRange
{
    public function __construct(
        public Carbon $start,
        public Carbon $end,
    ) {}
}
