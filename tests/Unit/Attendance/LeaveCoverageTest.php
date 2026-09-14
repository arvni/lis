<?php

declare(strict_types=1);

namespace Tests\Unit\Attendance;

use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\DTOs\TimeRange;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Services\LeaveCoverage;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class LeaveCoverageTest extends TestCase
{
    public function test_full_day_leave_covers_the_whole_shift_on_every_day_of_its_range(): void
    {
        $leave = $this->leave(LeaveType::DAILY, '2026-09-15', '2026-09-17');

        $this->assertSame([['08:00', '16:00']], $this->covered([$leave], '2026-09-15'));
        $this->assertSame([['08:00', '16:00']], $this->covered([$leave], '2026-09-17'));
    }

    public function test_full_day_leave_covers_nothing_outside_its_range(): void
    {
        $leave = $this->leave(LeaveType::DAILY, '2026-09-15', '2026-09-17');

        $this->assertSame([], $this->covered([$leave], '2026-09-14'));
        $this->assertSame([], $this->covered([$leave], '2026-09-18'));
    }

    public function test_hourly_leave_is_trimmed_to_the_shift_hours(): void
    {
        $early = $this->leave(LeaveType::HOURLY, '2026-09-15', '2026-09-15', '07:00:00', '09:00:00');
        $late = $this->leave(LeaveType::HOURLY, '2026-09-15', '2026-09-15', '15:00:00', '18:00:00');

        $this->assertSame([['08:00', '09:00'], ['15:00', '16:00']], $this->covered([$early, $late], '2026-09-15'));
    }

    public function test_hourly_leave_outside_the_shift_or_on_another_day_covers_nothing(): void
    {
        $evening = $this->leave(LeaveType::HOURLY, '2026-09-15', '2026-09-15', '17:00:00', '19:00:00');
        $otherDay = $this->leave(LeaveType::HOURLY, '2026-09-16', '2026-09-16', '09:00:00', '10:00:00');

        $this->assertSame([], $this->covered([$evening, $otherDay], '2026-09-15'));
    }

    private function leave(LeaveType $type, string $from, string $to, ?string $startTime = null, ?string $endTime = null): LeaveRequest
    {
        return new LeaveRequest([
            'type' => $type,
            'start_date' => $from,
            'end_date' => $to,
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);
    }

    /**
     * @param  list<LeaveRequest>  $leaves
     * @return list<array{0: string, 1: string}>
     */
    private function covered(array $leaves, string $date): array
    {
        $ranges = (new LeaveCoverage)->excusedOn($leaves, Carbon::parse($date), new ShiftHours('08:00:00', '16:00:00'));

        return array_map(fn (TimeRange $range) => [$range->start->format('H:i'), $range->end->format('H:i')], $ranges);
    }
}
