<?php

namespace App\Domains\Laboratory\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MethodResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => $this->resolvePrice(),
            'price_type' => $this->resolvePriceType(),
            'extra' => $this->resolveExtra(),
            'no_patient' => $this->no_patient,
            'test' => $this->whenLoaded('test', fn() => $this->test),
        ];
    }

    /**
     * Resolve the price based on the referrer method relationship.
     *
     * @return float|null
     */
    protected function resolvePrice()
    {
        if ($this->relationLoaded("referrerMethod"))
            return $this->referrerMethod->price ?? null;
        return $this->price;
    }

    /**
     * Resolve the price type based on the referrer method relationship.
     *
     * @return string|null
     */
    protected function resolvePriceType()
    {
        if ($this->relationLoaded("referrerMethod"))
            return $this->referrerMethod->price_type ?? null;
        return $this->price_type;
    }

    /**
     * Resolve extra information based on the referrer method relationship.
     *
     * @return array|null
     */
    protected function resolveExtra(): ?array
    {
        if ($this->relationLoaded("referrerMethod"))
            return $this->referrerMethod->extra ?? null;
        return $this->extra;
    }
}
