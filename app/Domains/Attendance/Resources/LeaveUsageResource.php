<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Resources;

use App\Domains\Attendance\DTOs\CountedLeave;
use App\Domains\Attendance\DTOs\LeaveUsage;
use App\Domains\Attendance\DTOs\LeaveUsageLine;
use App\Domains\User\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveUsageResource extends JsonResource
{
    public function __construct(LeaveUsage $resource)
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var LeaveUsage $usage */
        $usage = $this->resource;

        return [
            'year' => $usage->year,
            'total' => self::line($usage->total),
            'kinds' => array_map(self::line(...), $usage->kinds),
            'requests' => array_map(fn (CountedLeave $counted) => [
                'id' => $counted->leave->id,
                'kind' => $counted->leave->kind->name ?? 'Leave',
                'type' => $counted->leave->type->value,
                'type_label' => $counted->leave->type->label(),
                'start_date' => $counted->leave->start_date->format('Y-m-d'),
                'end_date' => $counted->leave->end_date->format('Y-m-d'),
                'start_time' => $counted->leave->start_time !== null ? substr($counted->leave->start_time, 0, 5) : null,
                'end_time' => $counted->leave->end_time !== null ? substr($counted->leave->end_time, 0, 5) : null,
                'status' => $counted->leave->status->value,
                'status_label' => $counted->leave->status->label(),
                // Working days (full-day leave) or minutes (hourly leave) inside the year.
                'days' => $counted->days(),
                'minutes' => $counted->minutes(),
            ], $usage->requests),
        ];
    }

    /**
     * One row of the all-staff table.
     *
     * @return array<string, mixed>
     */
    public static function staffRow(User $user, LeaveUsage $usage): array
    {
        return [
            'user' => ['id' => $user->id, 'name' => $user->name],
            ...self::line($usage->total),
            'kinds' => array_map(self::line(...), $usage->kinds),
        ];
    }

    /**
     * @return array{kind: string, taken_days: int, taken_minutes: int, booked_days: int, booked_minutes: int, pending_days: int, pending_minutes: int}
     */
    private static function line(LeaveUsageLine $line): array
    {
        return [
            'kind' => $line->kindName,
            'taken_days' => $line->takenDays,
            'taken_minutes' => $line->takenMinutes,
            'booked_days' => $line->bookedDays,
            'booked_minutes' => $line->bookedMinutes,
            'pending_days' => $line->pendingDays,
            'pending_minutes' => $line->pendingMinutes,
        ];
    }
}
