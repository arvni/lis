<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Support;

use App\Domains\Attendance\DTOs\ParsedPunch;
use App\Domains\Attendance\DTOs\PunchSheet;
use DateTimeZone;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use RuntimeException;

/**
 * Reads door punches out of a spreadsheet's cells, whatever layout the file was exported in:
 * one "date and time" column, separate "date" and "time" columns, or all three (the combined
 * column wins, the separate ones fill in what it lacks).
 *
 * Cells may be real Excel dates/times or text: `2026-09-14T08:11:04`, `2026/09/14 08:11`,
 * `14/09/2026 8:11 AM`, `08:11:04`. Text dates are year-first or day-first, never month-first.
 */
class PunchSheetParser
{
    /** Exported reports can have title rows above the headings; look this far down for them. */
    private const HEADING_SEARCH_ROWS = 20;

    // Headings are compared lower-cased with every run of other characters turned into "_",
    // so "Employee ID", "employee_id" and "EMPLOYEE-ID" are the same. Earlier names win.
    private const ID_HEADINGS = [
        'attendance_id', 'employee_id', 'employee_no', 'employee_number', 'employee_code', 'emp_id', 'emp_no',
        'person_id', 'person_no', 'staff_id', 'staff_no', 'attendance_number', 'attendance_no',
    ];

    private const DATE_AND_TIME_HEADINGS = [
        'access_date_and_time', 'access_datetime', 'access_date_time', 'punch_date_and_time', 'punch_datetime',
        'event_date_and_time', 'date_and_time', 'date_time', 'datetime',
    ];

    private const DATE_HEADINGS = ['access_date', 'punch_date', 'attendance_date', 'event_date', 'date'];

    private const TIME_HEADINGS = ['access_time', 'punch_time', 'attendance_time', 'event_time', 'check_time', 'time'];

    private const DATE_PATTERN = '(?:(?<year>\d{4})[-\/.](?<month>\d{1,2})[-\/.](?<day>\d{1,2})'
        .'|(?<dayFirst>\d{1,2})[-\/.](?<monthFirst>\d{1,2})[-\/.](?<yearLast>\d{4}))';

    private const TIME_PATTERN = '(?<hour>\d{1,2}):(?<minute>\d{2})(?::(?<second>\d{2})(?:\.\d+)?)?'
        .'\s*(?<meridiem>[ap]m)?\s*(?<offset>z|[+-]\d{2}:?\d{2})?';

    /**
     * @param  list<list<mixed>>  $rows  the sheet's cells, top to bottom, starting at row 1
     *
     * @throws RuntimeException when no row within the first 20 names an Employee ID column and a date or time column
     */
    public function parse(array $rows, Carbon $now): PunchSheet
    {
        [$headingIndex, $idColumn, $dateTimeColumns, $columns] = $this->findHeadings($rows);
        [$dateAndTimeColumn, $dateColumn, $timeColumn] = $dateTimeColumns;

        $punches = [];
        $errors = [];
        foreach (array_slice($rows, $headingIndex + 1, preserve_keys: true) as $index => $cells) {
            $rowNumber = $index + 1;
            if ($this->isBlank($cells)) {
                continue;
            }

            $attendanceId = $this->readId($cells[$idColumn] ?? null);
            if (in_array($this->normalizeHeading($attendanceId), self::ID_HEADINGS, true)) {
                // The headings again, as printed on each page of a multi-page export.
                continue;
            }
            if ($attendanceId === '') {
                $errors[] = "Row $rowNumber: no Employee ID.";

                continue;
            }
            if (mb_strlen($attendanceId) > 64) {
                $errors[] = "Row $rowNumber: the Employee ID is longer than 64 characters.";

                continue;
            }

            $combined = $this->readCell($dateAndTimeColumn === null ? null : ($cells[$dateAndTimeColumn] ?? null), false);
            $date = $this->readCell($dateColumn === null ? null : ($cells[$dateColumn] ?? null), false);
            $time = $this->readCell($timeColumn === null ? null : ($cells[$timeColumn] ?? null), true);

            $day = $combined['date'] ?? $date['date'] ?? $time['date'];
            $clock = $combined['time'] ?? $time['time'] ?? $date['time'];
            $written = $this->writtenValues($cells, $dateTimeColumns);

            if ($day === null) {
                $errors[] = $written === '' ? "Row $rowNumber: no date." : "Row $rowNumber: can't read a date from \"$written\".";

                continue;
            }
            if ($clock === null) {
                $errors[] = "Row $rowNumber: can't read a time from \"$written\".";

                continue;
            }

            $at = Carbon::createFromFormat('Y-m-d H:i:s', "$day $clock");
            if ($at === null) {
                $errors[] = "Row $rowNumber: can't read a date from \"$written\".";

                continue;
            }
            if ($at->gt($now)) {
                $errors[] = "Row $rowNumber: {$at->format('Y-m-d H:i:s')} is in the future.";

                continue;
            }

            $punches[] = new ParsedPunch($rowNumber, $attendanceId, $at);
        }

        return new PunchSheet($punches, $errors, $columns);
    }

    /**
     * The heading row's index, its Employee ID column, its [date and time, date, time] columns and
     * those columns' headings as written.
     *
     * @param  list<list<mixed>>  $rows
     * @return array{int, int, array{int|null, int|null, int|null}, list<string>}
     */
    private function findHeadings(array $rows): array
    {
        foreach (array_slice($rows, 0, self::HEADING_SEARCH_ROWS) as $index => $cells) {
            $headings = array_map($this->normalizeHeading(...), $cells);

            $idColumn = $this->findColumn($headings, self::ID_HEADINGS);
            $dateTimeColumns = [
                $this->findColumn($headings, self::DATE_AND_TIME_HEADINGS),
                $this->findColumn($headings, self::DATE_HEADINGS),
                $this->findColumn($headings, self::TIME_HEADINGS),
            ];
            if ($idColumn === null || $dateTimeColumns === [null, null, null]) {
                continue;
            }

            $columns = [];
            foreach ([$idColumn, ...$dateTimeColumns] as $column) {
                if ($column !== null) {
                    $columns[] = trim($this->text($cells[$column]));
                }
            }

            return [$index, $idColumn, $dateTimeColumns, $columns];
        }

        throw new RuntimeException(
            'No heading row found. The file needs an "Employee ID" column and either a "Date and Time" column '
            .'or "Date" and "Time" columns.'
        );
    }

    /**
     * @param  list<string>  $headings  normalized
     * @param  list<string>  $names
     */
    private function findColumn(array $headings, array $names): ?int
    {
        foreach ($names as $name) {
            $column = array_search($name, $headings, true);
            if ($column !== false) {
                return (int) $column;
            }
        }

        return null;
    }

    private function normalizeHeading(mixed $cell): string
    {
        return trim((string) preg_replace('/[^a-z0-9]+/', '_', strtolower(trim($this->text($cell)))), '_');
    }

    /**
     * A cell's date and/or time part, as Y-m-d and H:i:s.
     *
     * @param  bool  $timeColumn  a bare Excel number here is a time of day, so 0 means midnight
     * @return array{date: string|null, time: string|null}
     */
    private function readCell(mixed $value, bool $timeColumn): array
    {
        if (is_int($value) || is_float($value)) {
            return $this->readExcelSerial((float) $value, $timeColumn);
        }

        $text = trim($this->text($value));
        $none = ['date' => null, 'time' => null];
        if ($text === '') {
            return $none;
        }

        if (preg_match('/^'.self::DATE_PATTERN.'(?:\s*t\s*|\s+)?(?:'.self::TIME_PATTERN.')?$/i', $text, $match)) {
            $date = ($match['year'] ?? '') !== ''
                ? $this->makeDate($match['year'], $match['month'], $match['day'])
                : $this->makeDate($match['yearLast'], $match['monthFirst'], $match['dayFirst']);
            $time = ($match['hour'] ?? '') !== ''
                ? $this->makeTime($match['hour'], $match['minute'], $match['second'] ?? '', $match['meridiem'] ?? '')
                : null;

            if ($date !== null && $time !== null && ($match['offset'] ?? '') !== '') {
                return $this->toLocalTime($date, $time, $match['offset']);
            }

            return ['date' => $date, 'time' => $time];
        }

        if (preg_match('/^'.self::TIME_PATTERN.'$/i', $text, $match)) {
            return ['date' => null, 'time' => $this->makeTime($match['hour'], $match['minute'], $match['second'] ?? '', $match['meridiem'] ?? '')];
        }

        return $none;
    }

    /**
     * Excel stores a date as whole days since 1900 and a time as the fraction of a day.
     *
     * @return array{date: string|null, time: string|null}
     */
    private function readExcelSerial(float $value, bool $timeColumn): array
    {
        if ($value < 0) {
            return ['date' => null, 'time' => null];
        }

        $days = (int) floor($value);
        $seconds = (int) round(($value - $days) * 86400);
        if ($seconds === 86400) {
            $days++;
            $seconds = 0;
        }

        $date = null;
        if ($days > 0) {
            $excelDate = ExcelDate::excelToDateTimeObject($days);
            $date = $this->makeDate($excelDate->format('Y'), $excelDate->format('m'), $excelDate->format('d'));
        }

        $time = $seconds > 0 || $timeColumn
            ? sprintf('%02d:%02d:%02d', intdiv($seconds, 3600), intdiv($seconds % 3600, 60), $seconds % 60)
            : null;

        return ['date' => $date, 'time' => $time];
    }

    private function makeDate(string $year, string $month, string $day): ?string
    {
        [$y, $m, $d] = [(int) $year, (int) $month, (int) $day];

        // Anything outside this range is a misread cell (an ID, a count), not a punch.
        return $y >= 2000 && $y <= 2100 && checkdate($m, $d, $y) ? sprintf('%04d-%02d-%02d', $y, $m, $d) : null;
    }

    private function makeTime(string $hour, string $minute, string $second, string $meridiem): ?string
    {
        [$h, $i, $s] = [(int) $hour, (int) $minute, (int) $second];

        $meridiem = strtolower($meridiem);
        if ($meridiem !== '') {
            if ($h < 1 || $h > 12) {
                return null;
            }
            $h = $h % 12 + ($meridiem === 'pm' ? 12 : 0);
        }

        return $h <= 23 && $i <= 59 && $s <= 59 ? sprintf('%02d:%02d:%02d', $h, $i, $s) : null;
    }

    /**
     * A time written with a UTC offset, moved to the LIS's own time zone.
     *
     * @return array{date: string, time: string}
     */
    private function toLocalTime(string $date, string $time, string $offset): array
    {
        $zone = strtolower($offset) === 'z' ? 'UTC' : substr($offset, 0, 3).':'.substr($offset, -2);
        $local = Carbon::createFromFormat('Y-m-d H:i:s', "$date $time", new DateTimeZone($zone))
            ?->setTimezone(date_default_timezone_get());

        return $local === null
            ? ['date' => $date, 'time' => $time]
            : ['date' => $local->format('Y-m-d'), 'time' => $local->format('H:i:s')];
    }

    private function readId(mixed $value): string
    {
        // A numeric cell comes back as a float: 123.0 is Employee ID "123".
        if (is_float($value) && floor($value) === $value) {
            return (string) (int) $value;
        }

        return trim($this->text($value));
    }

    /**
     * @param  list<mixed>  $cells
     */
    private function isBlank(array $cells): bool
    {
        foreach ($cells as $cell) {
            if (trim($this->text($cell)) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * What the row says in its date/time columns, for error messages.
     *
     * @param  list<mixed>  $cells
     * @param  array{int|null, int|null, int|null}  $columns
     */
    private function writtenValues(array $cells, array $columns): string
    {
        $values = [];
        foreach ($columns as $column) {
            $value = $column === null ? '' : trim($this->text($cells[$column] ?? null));
            if ($value !== '') {
                $values[] = $value;
            }
        }

        return implode(' ', $values);
    }

    private function text(mixed $value): string
    {
        return is_scalar($value) ? (string) $value : '';
    }
}
