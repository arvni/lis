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
        $leave = self::coveredMinutes($start, $end, $excused);

        // Leave for the whole working day: nothing else to judge, even while the day is still running.
        if ($leave > 0 && $leave >= self::minutesBetween($start, $end)) {
            return new AttendanceDayResult(AttendanceStatus::LEAVE, $checkIn, $checkOut, 0, 0, $worked, $leave);
        }

        if ($checkIn === null) {
            return $now->lt($end)
                ? null
                : new AttendanceDayResult(AttendanceStatus::ABSENT, null, null, 0, 0, 0, $leave);
        }

        $late = self::minutesBetween(self::expectedArrival($start, $excused), $checkIn);

        if ($checkOut === null) {
            return new AttendanceDayResult(AttendanceStatus::INCOMPLETE, $checkIn, null, $late, 0, 0, $leave);
        }

        $early = self::minutesBetween($checkOut, self::expectedDeparture($end, $excused));

        return new AttendanceDayResult(AttendanceStatus::PRESENT, $checkIn, $checkOut, $late, $early, $worked, $leave);
    }

    /**
     * Whole minutes of the shift covered by excused time; overlapping ranges count once.
     *
     * @param  list<TimeRange>  $excused
     */
    private static function coveredMinutes(Carbon $start, Carbon $end, array $excused): int
    {
        $spans = [];
        foreach ($excused as $range) {
            $from = max($range->start->getTimestamp(), $start->getTimestamp());
            $to = min($range->end->getTimestamp(), $end->getTimestamp());
            if ($from < $to) {
                $spans[] = [$from, $to];
            }
        }
        usort($spans, fn (array $a, array $b) => $a[0] <=> $b[0]);

        $covered = 0;
        $reach = PHP_INT_MIN;
        foreach ($spans as [$from, $to]) {
            $from = max($from, $reach);
            if ($to > $from) {
                $covered += $to - $from;
            }
            $reach = max($reach, $to);
        }

        return intdiv($covered, 60);
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
