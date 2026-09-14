<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Resources;

use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\ShiftDay;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Shift
 */
class ShiftResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'is_active' => $this->is_active,
            // "H:i", the format the form's time pickers send back.
            'days' => $this->whenLoaded('days', fn () => $this->days->map(fn (ShiftDay $day) => [
                'weekday' => $day->weekday->value,
                'start_time' => substr($day->start_time, 0, 5),
                'end_time' => substr($day->end_time, 0, 5),
            ])->values()),
        ];
    }
}
