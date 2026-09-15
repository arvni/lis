<?php

declare(strict_types=1);

namespace Tests\Unit\Attendance;

use App\Domains\Attendance\DTOs\AttendanceDayResult;
use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\DTOs\TimeRange;
use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Services\AttendanceDayCalculator;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\TestCase;

class AttendanceDayCalculatorTest extends TestCase
{
    private const DAY = '2026-09-14';

    public function test_the_first_and_last_punch_count_and_the_ones_between_are_ignored(): void
    {
        $result = $this->calculate($this->morning(), ['12:02:40', '08:11:04', '15:47:52', '13:01:15']);

        $this->assertSame(AttendanceStatus::PRESENT, $result?->status);
        $this->assertSame('2026-09-14 08:11:04', $result->checkIn?->format('Y-m-d H:i:s'));
        $this->assertSame('2026-09-14 15:47:52', $result->checkOut?->format('Y-m-d H:i:s'));
        $this->assertSame(11, $result->lateMinutes);
        $this->assertSame(12, $result->earlyLeaveMinutes);
        $this->assertSame(456, $result->workedMinutes);
    }

    public function test_arriving_early_and_leaving_late_never_count_negative(): void
    {
        $result = $this->calculate($this->morning(), ['07:50:00', '16:30:00']);

        $this->assertSame(0, $result?->lateMinutes);
        $this->assertSame(0, $result->earlyLeaveMinutes);
        $this->assertSame(520, $result->workedMinutes);
    }

    public function test_there_is_no_grace_period(): void
    {
        $result = $this->calculate($this->morning(), ['08:01:00', '16:00:00']);

        $this->assertSame(1, $result?->lateMinutes);
    }

    public function test_a_single_punch_is_a_check_in_without_a_check_out(): void
    {
        $result = $this->calculate($this->morning(), ['08:30:00']);

        $this->assertSame(AttendanceStatus::INCOMPLETE, $result?->status);
        $this->assertSame('08:30:00', $result->checkIn?->format('H:i:s'));
        $this->assertNull($result->checkOut);
        $this->assertSame(30, $result->lateMinutes);
        $this->assertSame(0, $result->earlyLeaveMinutes);
        $this->assertSame(0, $result->workedMinutes);
    }

    public function test_a_past_working_day_without_punches_is_absent(): void
    {
        $result = $this->calculate($this->morning(), []);

        $this->assertSame(AttendanceStatus::ABSENT, $result?->status);
        $this->assertNull($result->checkIn);
        $this->assertSame(0, $result->workedMinutes);
    }

    public function test_nothing_is_recorded_for_today_until_the_shift_has_ended(): void
    {
        $this->assertNull($this->calculate($this->morning(), [], now: '2026-09-14 15:59:59'));

        $this->assertSame(
            AttendanceStatus::ABSENT,
            $this->calculate($this->morning(), [], now: '2026-09-14 16:00:00')?->status
        );
    }

    public function test_a_person_already_at_work_today_is_checked_in(): void
    {
        $result = $this->calculate($this->morning(), ['08:00:00'], now: '2026-09-14 10:00:00');

        $this->assertSame(AttendanceStatus::INCOMPLETE, $result?->status);
        $this->assertSame(0, $result->lateMinutes);
    }

    public function test_a_holiday_is_a_holiday_even_when_someone_came_in(): void
    {
        $result = $this->calculate($this->morning(), ['09:00:00', '11:00:00'], holiday: true);

        $this->assertSame(AttendanceStatus::HOLIDAY, $result?->status);
        $this->assertSame(0, $result->lateMinutes);
        $this->assertSame(0, $result->earlyLeaveMinutes);
        $this->assertSame(120, $result->workedMinutes);
    }

    public function test_a_weekday_without_hours_is_a_day_off(): void
    {
        $this->assertSame(AttendanceStatus::OFF, $this->calculate(null, [])?->status);

        $withPunches = $this->calculate(null, ['10:00:00', '12:30:00']);
        $this->assertSame(AttendanceStatus::OFF, $withPunches?->status);
        $this->assertSame(150, $withPunches->workedMinutes);
    }

    public function test_excused_time_at_the_start_moves_when_the_person_is_expected_in(): void
    {
        $result = $this->calculate($this->morning(), ['10:05:00', '16:00:00'], excused: [['08:00', '10:00']]);

        $this->assertSame(5, $result?->lateMinutes);
    }

    public function test_back_to_back_excused_time_is_followed_through(): void
    {
        $result = $this->calculate($this->morning(), ['10:05:00', '16:00:00'], excused: [['09:00', '10:00'], ['08:00', '09:00']]);

        $this->assertSame(5, $result?->lateMinutes);
    }

    public function test_excused_time_at_the_end_moves_when_the_person_may_leave(): void
    {
        $result = $this->calculate($this->morning(), ['08:00:00', '13:50:00'], excused: [['14:00', '16:00']]);

        $this->assertSame(10, $result?->earlyLeaveMinutes);
    }

    public function test_excused_time_in_the_middle_of_the_day_changes_nothing(): void
    {
        $result = $this->calculate($this->morning(), ['08:11:04', '15:47:52'], excused: [['11:00', '12:00']]);

        $this->assertSame(11, $result?->lateMinutes);
        $this->assertSame(12, $result->earlyLeaveMinutes);
    }

    private function morning(): ShiftHours
    {
        return new ShiftHours('08:00:00', '16:00:00');
    }

    /**
     * @param  list<string>  $punchTimes  H:i:s on DAY
     * @param  list<array{0: string, 1: string}>  $excused  [start, end] H:i on DAY
     */
    private function calculate(
        ?ShiftHours $hours,
        array $punchTimes,
        bool $holiday = false,
        array $excused = [],
        string $now = '2026-09-15 09:00:00',
    ): ?AttendanceDayResult {
        return (new AttendanceDayCalculator)->calculate(
            Carbon::parse(self::DAY),
            $hours,
            $holiday,
            array_map(fn (string $time) => Carbon::parse(self::DAY.' '.$time), $punchTimes),
            array_map(fn (array $range) => new TimeRange(
                Carbon::parse(self::DAY.' '.$range[0]),
                Carbon::parse(self::DAY.' '.$range[1]),
            ), $excused),
            Carbon::parse($now),
        );
    }
}
