<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Resources;

use App\Domains\Attendance\Models\AttendanceDay;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AttendanceDay
 */
class AttendanceDayResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date->format('Y-m-d'),
            'weekday' => $this->date->format('D'),
            'user' => $this->whenLoaded('user', fn () => ['id' => $this->user->id, 'name' => $this->user->name]),
            'shift' => $this->whenLoaded('shift', fn () => $this->shift ? ['id' => $this->shift->id, 'name' => $this->shift->name] : null),
            // "H:i", the format the correction form's time pickers use.
            'scheduled_start' => $this->scheduled_start !== null ? substr($this->scheduled_start, 0, 5) : null,
            'scheduled_end' => $this->scheduled_end !== null ? substr($this->scheduled_end, 0, 5) : null,
            'check_in' => $this->check_in?->format('H:i'),
            'check_out' => $this->check_out?->format('H:i'),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'late_minutes' => $this->late_minutes,
            'early_leave_minutes' => $this->early_leave_minutes,
            'worked_minutes' => $this->worked_minutes,
            'is_manual' => $this->is_manual,
            'note' => $this->note,
            'corrected_by' => $this->whenLoaded('correctedBy', fn () => $this->correctedBy?->name),
            'corrected_at' => $this->corrected_at?->format('Y-m-d H:i'),
        ];
    }
}
