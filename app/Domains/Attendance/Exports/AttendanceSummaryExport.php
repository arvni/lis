<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Exports;

use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Everyone's month in one sheet: a row per person with a shift or recorded days.
 */
class AttendanceSummaryExport implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    private const HEADINGS = [
        'Person',
        'Attendance No.',
        'Scheduled (min)',
        'Worked (min)',
        'Overtime (min)',
        'Late (min)',
        'Early Leave (min)',
        'On Leave (min)',
        'Days Present',
        'Days Absent',
        'Days On Leave',
        'Corrected Days',
    ];

    /**
     * @param  list<array{name: string, attendance_number: string|null, scheduled_minutes: int, worked_minutes: int, overtime_minutes: int, late_minutes: int, early_leave_minutes: int, leave_minutes: int, present_days: int, absent_days: int, leave_days: int, corrected_days: int}>  $people
     */
    public function __construct(
        private readonly Carbon $month,
        private readonly array $people,
    ) {}

    /**
     * @return list<list<mixed>>
     */
    public function array(): array
    {
        return array_map(fn (array $person) => [
            $person['name'],
            $person['attendance_number'],
            $person['scheduled_minutes'],
            $person['worked_minutes'],
            $person['overtime_minutes'],
            $person['late_minutes'],
            $person['early_leave_minutes'],
            $person['leave_minutes'],
            $person['present_days'],
            $person['absent_days'],
            $person['leave_days'],
            $person['corrected_days'],
        ], $this->people);
    }

    /** @return list<string> */
    public function headings(): array
    {
        return self::HEADINGS;
    }

    /** @return array<int, array<string, mixed>> */
    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:L1');

        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'ffffff']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '0361ac']],
            ],
        ];
    }

    public function title(): string
    {
        return 'Attendance '.$this->month->format('M Y');
    }
}
