<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Generic id/name option resource; wraps several models (some expose name, others fullName).
 *
 * @property int $id
 * @property string|null $fullName
 * @property \Illuminate\Database\Eloquent\Collection $methodTests
 *
 * @method bool relationLoaded(string $key)
 */
class ListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name ?? $this->fullName,
            'color'      => $this->color ?? null,
            'method_ids' => $this->when(
                $this->relationLoaded('methodTests'),
                fn () => $this->methodTests->pluck('method_id')->toArray()
            ),
        ];
    }
}
