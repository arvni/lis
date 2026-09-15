<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Events;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Something that past attendance depends on changed (a holiday, a shift assignment), so the days
 * between the dates need recalculating.
 */
class AttendanceRebuildRequested
{
    use Dispatchable;

    /**
     * @param  string  $from  Y-m-d
     * @param  string  $to  Y-m-d
     * @param  list<int>|null  $userIds  only these users (null = everyone)
     */
    public function __construct(
        public readonly string $from,
        public readonly string $to,
        public readonly ?array $userIds = null,
    ) {}
}
