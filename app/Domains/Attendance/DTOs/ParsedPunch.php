<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

use Illuminate\Support\Carbon;

/**
 * One punch read from an imported sheet.
 */
final readonly class ParsedPunch
{
    public function __construct(
        public int $row,
        public string $attendanceId,
        public Carbon $at,
    ) {}
}
