<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Resources;

use App\Domains\Attendance\Models\UserShift;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin UserShift
 */
class UserShiftResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $today = today();

        return [
            'id' => $this->id,
            'shift' => $this->whenLoaded('shift', fn () => [
                'id' => $this->shift->id,
                'name' => $this->shift->name,
                'is_active' => $this->shift->is_active,
            ]),
            'effective_from' => $this->effective_from->format('Y-m-d'),
            'effective_to' => $this->effective_to?->format('Y-m-d'),
            'is_current' => $this->effective_from->lte($today)
                && ($this->effective_to === null || $this->effective_to->gte($today)),
        ];
    }
}
