<?php

declare(strict_types=1);

namespace Tests\Unit\Attendance;

use App\Domains\Attendance\DTOs\ParsedPunch;
use App\Domains\Attendance\DTOs\PunchSheet;
use App\Domains\Attendance\Support\PunchSheetParser;
use DateTimeImmutable;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use RuntimeException;
use Tests\TestCase;

/**
 * "Now" is Thursday 17 Sep 2026 18:00 in the LIS time zone (Asia/Muscat, UTC+4).
 */
class PunchSheetParserTest extends TestCase
{
    public function test_text_dates_and_times_in_one_column(): void
    {
        $sheet = $this->parse([
            ['Employee ID', 'Date and Time'],
            ['00123', '2026-09-14T08:11:04'],
            ['00123', '2026/09/14 15:47'],
            ['00123', '15/09/2026 8:05 PM'],
            ['00123', '16.09.2026 07:59:30'],
            ['00123', '16-09-2026 12:00 am'],
        ]);

        $this->assertSame([
            '00123 2026-09-14 08:11:04',
            '00123 2026-09-14 15:47:00',
            '00123 2026-09-15 20:05:00',
            '00123 2026-09-16 07:59:30',
            '00123 2026-09-16 00:00:00',
        ], $this->punches($sheet));
        $this->assertSame(['Employee ID', 'Date and Time'], $sheet->columns);
        $this->assertSame([], $sheet->errors);
    }

    public function test_excel_dates_and_times_in_one_column(): void
    {
        $sheet = $this->parse([
            ['Employee ID', 'Access Date and Time'],
            ['00123', $this->excel('2026-09-14 08:11:04')],
            ['00123', $this->excel('2026-09-14 23:59:59')],
        ]);

        $this->assertSame(['00123 2026-09-14 08:11:04', '00123 2026-09-14 23:59:59'], $this->punches($sheet));
    }

    public function test_separate_date_and_time_columns_are_combined(): void
    {
        $sheet = $this->parse([
            ['Person ID', 'Name', 'Date', 'Time'],
            ['00123', 'Sara', $this->excel('2026-09-14'), $this->excel('08:11:04')],
            ['00123', 'Sara', '2026-09-14', '4:05 PM'],
            ['00456', 'Omar', '15/09/2026', $this->excel('00:00:00')],
        ]);

        $this->assertSame([
            '00123 2026-09-14 08:11:04',
            '00123 2026-09-14 16:05:00',
            '00456 2026-09-15 00:00:00',
        ], $this->punches($sheet));
        $this->assertSame(['Person ID', 'Date', 'Time'], $sheet->columns);
    }

    public function test_with_all_three_columns_the_combined_one_wins_and_the_others_fill_gaps(): void
    {
        $sheet = $this->parse([
            ['Employee ID', 'Access Date and Time', 'Access Date', 'Access Time'],
            ['00123', '2026-09-14T08:11:04', '2026-09-01', '09:00:00'],
            ['00123', '', '2026-09-14', '15:47:52'],
            ['00123', '2026-09-15', '', '08:02:00'],
        ]);

        $this->assertSame([
            '00123 2026-09-14 08:11:04',
            '00123 2026-09-14 15:47:52',
            '00123 2026-09-15 08:02:00',
        ], $this->punches($sheet));
    }

    public function test_a_time_column_holding_the_whole_date_and_time_is_read(): void
    {
        $sheet = $this->parse([
            ['Employee No', 'Event Time'],
            ['00123', '2026-09-14 08:11:04'],
        ]);

        $this->assertSame(['00123 2026-09-14 08:11:04'], $this->punches($sheet));
    }

    public function test_times_with_a_utc_offset_move_to_the_lis_time_zone(): void
    {
        $sheet = $this->parse([
            ['Employee ID', 'Date and Time'],
            ['00123', '2026-09-14T04:11:04Z'],
            ['00123', '2026-09-14T06:11:04+02:00'],
        ]);

        $this->assertSame(['00123 2026-09-14 08:11:04', '00123 2026-09-14 08:11:04'], $this->punches($sheet));
    }

    public function test_headings_below_title_rows_are_found_and_blank_and_repeated_heading_rows_skipped(): void
    {
        $sheet = $this->parse([
            ['Access Records', null, null],
            ['Exported on 2026-09-17', null, null],
            [null, null, null],
            ['EMPLOYEE-ID', 'access date', 'ACCESS_TIME'],
            ['00123', '2026-09-14', '08:11:04'],
            [null, '', '  '],
            ['EMPLOYEE-ID', 'access date', 'ACCESS_TIME'],
            [123.0, '2026-09-14', '09:00'],
        ]);

        $this->assertSame(['00123 2026-09-14 08:11:04', '123 2026-09-14 09:00:00'], $this->punches($sheet));
        $this->assertSame(8, $sheet->punches[1]->row);
        $this->assertSame([], $sheet->errors);
    }

    public function test_rows_that_cannot_be_read_are_reported_with_their_row_number(): void
    {
        $sheet = $this->parse([
            ['Employee ID', 'Date', 'Time'],
            ['', '2026-09-14', '08:00'],
            ['00123', '', ''],
            ['00123', 'yesterday', '08:00'],
            ['00123', '09/31/2026', '08:00'],
            ['00123', '2026-09-14', ''],
            ['00123', '2026-09-14', '25:00'],
            ['00123', '2026-09-18', '07:00'],
            ['00123', '2026-09-14', '08:00'],
        ]);

        $this->assertSame(['00123 2026-09-14 08:00:00'], $this->punches($sheet));
        $this->assertSame([
            'Row 2: no Employee ID.',
            'Row 3: no date.',
            'Row 4: can\'t read a date from "yesterday 08:00".',
            'Row 5: can\'t read a date from "09/31/2026 08:00".',
            'Row 6: can\'t read a time from "2026-09-14".',
            'Row 7: can\'t read a time from "2026-09-14 25:00".',
            'Row 8: 2026-09-18 07:00:00 is in the future.',
        ], $sheet->errors);
    }

    public function test_a_sheet_without_an_employee_id_and_date_heading_is_refused(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('No heading row found.');

        $this->parse([
            ['Name', 'When'],
            ['Sara', '2026-09-14 08:00'],
        ]);
    }

    /**
     * @param  list<list<mixed>>  $rows
     */
    private function parse(array $rows): PunchSheet
    {
        return (new PunchSheetParser)->parse($rows, Carbon::parse('2026-09-17 18:00:00'));
    }

    /**
     * @return list<string>
     */
    private function punches(PunchSheet $sheet): array
    {
        return array_map(
            fn (ParsedPunch $punch) => $punch->attendanceId.' '.$punch->at->format('Y-m-d H:i:s'),
            $sheet->punches,
        );
    }

    /**
     * The number Excel stores for a date, a time ("H:i:s" → fraction of a day) or both.
     */
    private function excel(string $value): float
    {
        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $value)) {
            [$h, $i, $s] = array_map('intval', explode(':', $value));

            return ($h * 3600 + $i * 60 + $s) / 86400;
        }

        return (float) ExcelDate::PHPToExcel(new DateTimeImmutable($value));
    }
}
