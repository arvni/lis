<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StatementResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ... parent::toArray($request),
            "invoices" => $this->acceptances->map(fn($item) => $item->invoice),
            "referrer" => ["id" => $this->referrer_id, "name" => $this->referrer?->fullName]
        ];
    }
}
