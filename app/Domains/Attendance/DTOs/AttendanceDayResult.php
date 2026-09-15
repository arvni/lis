<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

use App\Domains\Attendance\Enums\AttendanceStatus;
use Illuminate\Support\Carbon;

/**
 * How one person's day came out: what the attendance_days row should say.
 */
final readonly class AttendanceDayResult
{
    public function __construct(
        public AttendanceStatus $status,
        public ?Carbon $checkIn,
        public ?Carbon $checkOut,
        public int $lateMinutes,
        public int $earlyLeaveMinutes,
        public int $workedMinutes,
        public int $leaveMinutes = 0,
    ) {}
}
