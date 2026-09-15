<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Exports;

use App\Domains\Attendance\DTOs\CalendarDay;
use App\Domains\Attendance\DTOs\CalendarMonth;
use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\LeaveRequest;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * One person's month: a row per day, then the month's totals.
 */
class AttendanceMonthExport implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    private const HEADINGS = [
        'Date',
        'Day',
        'Shift',
        'Scheduled Start',
        'Scheduled End',
        'Scheduled (min)',
        'Status',
        'Check-in',
        'Check-out',
        'Late (min)',
        'Early Leave (min)',
        'Worked (min)',
        'Overtime (min)',
        'On Leave (min)',
        'Holiday',
        'Leave Requests',
        'Corrected',
        'Note',
    ];

    public function __construct(
        private readonly string $personName,
        private readonly CalendarMonth $month,
    ) {}

    /**
     * @return list<list<mixed>>
     */
    public function array(): array
    {
        $today = Carbon::today();
        $rows = array_map(fn (CalendarDay $day) => $this->row($day, $today), $this->month->days);

        $totals = $this->month->totals;
        $rows[] = [
            'Total', null, null, null, null,
            $totals['scheduled_minutes'],
            "{$totals['present_days']} present, {$totals['absent_days']} absent, {$totals['leave_days']} on leave",
            null, null,
            $totals['late_minutes'],
            $totals['early_leave_minutes'],
            $totals['worked_minutes'],
            $totals['overtime_minutes'],
            $totals['leave_minutes'],
            null, null,
            $totals['corrected_days'],
            null,
        ];

        return $rows;
    }

    /** @return list<string> */
    public function headings(): array
    {
        return self::HEADINGS;
    }

    /** @return array<int, array<string, mixed>> */
    public function styles(Worksheet $sheet): array
    {
        $sheet->setAutoFilter('A1:R1');
        $totalsRow = count($this->month->days) + 2;

        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'ffffff']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '0361ac']],
            ],
            $totalsRow => ['font' => ['bold' => true]],
        ];
    }

    public function title(): string
    {
        // Excel limits sheet names to 31 characters.
        return mb_substr($this->personName.' '.$this->month->month->format('M Y'), 0, 31);
    }

    /**
     * @return list<mixed>
     */
    private function row(CalendarDay $day, Carbon $today): array
    {
        $record = $day->record;

        return [
            $day->date->format('Y-m-d'),
            $day->date->format('l'),
            $day->assignment?->shift->name,
            $day->hours ? substr($day->hours->start, 0, 5) : null,
            $day->hours ? substr($day->hours->end, 0, 5) : null,
            $day->scheduledMinutes,
            $record ? $record->status->label() : $this->plannedStatus($day, $today),
            $record?->check_in?->format('H:i:s'),
            $record?->check_out?->format('H:i:s'),
            $record ? $record->late_minutes : null,
            $record ? $record->early_leave_minutes : null,
            $record ? $record->worked_minutes : null,
            $record ? $record->overtime_minutes : null,
            $record ? $record->leave_minutes : null,
            $day->holiday?->title,
            $day->leaves === [] ? null : implode('; ', array_map(fn (LeaveRequest $leave) => $this->leaveLabel($leave), $day->leaves)),
            $record ? ($record->is_manual ? 'Yes' : 'No') : null,
            $record?->note,
        ];
    }

    private function plannedStatus(CalendarDay $day, Carbon $today): string
    {
        return match (true) {
            $day->holiday !== null => 'Holiday',
            $day->hours === null => 'Day off',
            $day->date->gte($today) => 'Scheduled',
            default => 'No record',
        };
    }

    private function leaveLabel(LeaveRequest $leave): string
    {
        $label = $leave->kind->name ?? 'Leave';
        if ($leave->type === LeaveType::HOURLY) {
            $label .= ' '.substr((string) $leave->start_time, 0, 5).'–'.substr((string) $leave->end_time, 0, 5);
        }

        return $leave->status === LeaveRequestStatus::PENDING ? "$label (pending)" : $label;
    }
}
