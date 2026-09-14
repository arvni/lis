<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Exports;

use App\Domains\Attendance\Models\AttendanceDay;
use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttendanceDaysExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private const HEADINGS = [
        'Date',
        'Day',
        'User',
        'Shift',
        'Scheduled Start',
        'Scheduled End',
        'Check-in',
        'Check-out',
        'Status',
        'Late (min)',
        'Early Leave (min)',
        'Worked (min)',
        'On Leave (min)',
        'Corrected',
        'Note',
    ];

    /**
     * @param  Collection<int, AttendanceDay>  $days  with user and shift loaded
     */
    public function __construct(private readonly Collection $days) {}

    /** @return Collection<int, AttendanceDay> */
    public function collection(): Collection
    {
        return $this->days;
    }

    /**
     * @param  AttendanceDay  $day
     * @return list<mixed>
     */
    public function map($day): array
    {
        return [
            $day->date->format('Y-m-d'),
            $day->date->format('l'),
            $day->user?->name,
            $day->shift?->name,
            $day->scheduled_start !== null ? substr($day->scheduled_start, 0, 5) : null,
            $day->scheduled_end !== null ? substr($day->scheduled_end, 0, 5) : null,
            $day->check_in?->format('H:i:s'),
            $day->check_out?->format('H:i:s'),
            $day->status->label(),
            $day->late_minutes,
            $day->early_leave_minutes,
            $day->worked_minutes,
            $day->leave_minutes,
            $day->is_manual ? 'Yes' : 'No',
            $day->note,
        ];
    }

    /** @return list<string> */
    public function headings(): array
    {
        return self::HEADINGS;
    }

    /** @return array<int, array<string, mixed>> */
    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:O1');

        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'ffffff'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => '0361ac'],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Attendance';
    }
}
