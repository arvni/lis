<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Resources;

use App\Domains\Attendance\DTOs\CalendarDay;
use App\Domains\Attendance\DTOs\CalendarMonth;
use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Models\AttendanceDayChange;
use App\Domains\Attendance\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class AttendanceCalendarResource extends JsonResource
{
    public function __construct(CalendarMonth $resource)
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var CalendarMonth $month */
        $month = $this->resource;
        $today = Carbon::today();

        return [
            'month' => $month->month->format('Y-m'),
            'label' => $month->month->format('F Y'),
            'days' => array_map(fn (CalendarDay $day) => $this->day($day, $today), $month->days),
            'totals' => $month->totals,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function day(CalendarDay $day, Carbon $today): array
    {
        $record = $day->record;

        return [
            'date' => $day->date->format('Y-m-d'),
            'day' => (int) $day->date->format('j'),
            'weekday' => $day->date->format('D'),
            'is_today' => $day->date->isSameDay($today),
            'is_future' => $day->date->gt($today),
            'shift' => $day->assignment ? ['id' => $day->assignment->shift->id, 'name' => $day->assignment->shift->name] : null,
            // "H:i", as the rest of the attendance pages show times.
            'scheduled_start' => $day->hours ? substr($day->hours->start, 0, 5) : null,
            'scheduled_end' => $day->hours ? substr($day->hours->end, 0, 5) : null,
            'scheduled_minutes' => $day->scheduledMinutes,
            'holiday' => $day->holiday?->title,
            'leaves' => array_map(fn (LeaveRequest $leave) => [
                'id' => $leave->id,
                'kind' => $leave->kind->name ?? 'Leave',
                'type' => $leave->type->value,
                'start_time' => $leave->start_time !== null ? substr($leave->start_time, 0, 5) : null,
                'end_time' => $leave->end_time !== null ? substr($leave->end_time, 0, 5) : null,
                'status' => $leave->status->value,
                'status_label' => $leave->status->label(),
            ], $day->leaves),
            'attendance' => $record ? [
                'id' => $record->id,
                'status' => $record->status->value,
                'status_label' => $record->status->label(),
                'check_in' => $record->check_in?->format('H:i'),
                'check_out' => $record->check_out?->format('H:i'),
                'late_minutes' => $record->late_minutes,
                'early_leave_minutes' => $record->early_leave_minutes,
                'worked_minutes' => $record->worked_minutes,
                'overtime_minutes' => $record->overtime_minutes,
                'leave_minutes' => $record->leave_minutes,
                'is_manual' => $record->is_manual,
                'note' => $record->note,
            ] : null,
            'changes' => array_map(fn (AttendanceDayChange $change) => [
                'id' => $change->id,
                'action' => $change->action->value,
                'action_label' => $change->action->label(),
                'by' => $change->changedBy->name ?? 'Someone',
                'at' => $change->created_at?->format('Y-m-d H:i'),
                'note' => $change->note,
                'before' => $this->snapshot($change->before),
                'after' => $this->snapshot($change->after),
            ], $day->changes),
        ];
    }

    /**
     * @param  array<string, mixed>|null  $values
     * @return array<string, mixed>|null
     */
    private function snapshot(?array $values): ?array
    {
        if ($values === null) {
            return null;
        }

        return [
            'check_in' => isset($values['check_in']) ? substr((string) $values['check_in'], 0, 5) : null,
            'check_out' => isset($values['check_out']) ? substr((string) $values['check_out'], 0, 5) : null,
            'status_label' => AttendanceStatus::tryFrom((string) ($values['status'] ?? ''))?->label(),
            'worked_minutes' => (int) ($values['worked_minutes'] ?? 0),
            'late_minutes' => (int) ($values['late_minutes'] ?? 0),
        ];
    }
}
