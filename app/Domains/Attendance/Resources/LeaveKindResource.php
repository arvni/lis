<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Resources;

use App\Domains\Attendance\Models\LeaveKind;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LeaveKind
 */
class LeaveKindResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_active' => $this->is_active,
        ];
    }
}
