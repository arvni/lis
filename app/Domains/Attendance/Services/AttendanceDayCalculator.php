<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\AttendanceDayResult;
use App\Domains\Attendance\DTOs\ShiftHours;
use App\Domains\Attendance\DTOs\TimeRange;
use App\Domains\Attendance\Enums\AttendanceStatus;
use Illuminate\Support\Carbon;

/**
 * Judges one person's day from its punches. Pure: no database, no clock of its own.
 *
 * The first punch is the check-in and the last is the check-out; punches in between are ignored.
 * Minutes are whole minutes, rounded down, and there is no grace period.
 */
class AttendanceDayCalculator
{
    /**
     * @param  Carbon  $date  the day being judged
     * @param  ShiftHours|null  $hours  that weekday's shift hours; null on a day off or without a shift
     * @param  list<Carbon>  $punches  that day's punches, in any order
     * @param  list<TimeRange>  $excused  time the person is excused for, e.g. approved hourly leave
     * @param  Carbon  $now  the current moment, to tell a day still running from one that is over
     * @return AttendanceDayResult|null null when there is nothing to record yet: a working day with no
     *                                  punches that has not ended
     */
    public function calculate(Carbon $date, ?ShiftHours $hours, bool $isHoliday, array $punches, array $excused, Carbon $now): ?AttendanceDayResult
    {
        usort($punches, fn (Carbon $a, Carbon $b) => $a <=> $b);
        $checkIn = $punches[0] ?? null;
        $checkOut = count($punches) > 1 ? $punches[count($punches) - 1] : null;
        $worked = $checkIn !== null && $checkOut !== null ? self::minutesBetween($checkIn, $checkOut) : 0;

        if ($isHoliday || $hours === null) {
            $status = $isHoliday ? AttendanceStatus::HOLIDAY : AttendanceStatus::OFF;

            return new AttendanceDayResult($status, $checkIn, $checkOut, 0, 0, $worked);
        }

        $start = $date->copy()->setTimeFromTimeString($hours->start);
        $end = $date->copy()->setTimeFromTimeString($hours->end);

        if ($checkIn === null) {
            return $now->lt($end)
                ? null
                : new AttendanceDayResult(AttendanceStatus::ABSENT, null, null, 0, 0, 0);
        }

        $late = self::minutesBetween(self::expectedArrival($start, $excused), $checkIn);

        if ($checkOut === null) {
            return new AttendanceDayResult(AttendanceStatus::INCOMPLETE, $checkIn, null, $late, 0, 0);
        }

        $early = self::minutesBetween($checkOut, self::expectedDeparture($end, $excused));

        return new AttendanceDayResult(AttendanceStatus::PRESENT, $checkIn, $checkOut, $late, $early, $worked);
    }

    /**
     * Excused time at the start of the shift moves the moment the person is expected in.
     *
     * @param  list<TimeRange>  $excused
     */
    private static function expectedArrival(Carbon $start, array $excused): Carbon
    {
        $expected = $start;
        do {
            $moved = false;
            foreach ($excused as $range) {
                if ($range->start->lte($expected) && $range->end->gt($expected)) {
                    $expected = $range->end;
                    $moved = true;
                }
            }
        } while ($moved);

        return $expected;
    }

    /**
     * Excused time at the end of the shift moves the moment the person may leave.
     *
     * @param  list<TimeRange>  $excused
     */
    private static function expectedDeparture(Carbon $end, array $excused): Carbon
    {
        $expected = $end;
        do {
            $moved = false;
            foreach ($excused as $range) {
                if ($range->start->lt($expected) && $range->end->gte($expected)) {
                    $expected = $range->start;
                    $moved = true;
                }
            }
        } while ($moved);

        return $expected;
    }

    /** Whole minutes from one moment to a later one; never negative. */
    private static function minutesBetween(Carbon $from, Carbon $to): int
    {
        return intdiv(max(0, $to->getTimestamp() - $from->getTimestamp()), 60);
    }
}
