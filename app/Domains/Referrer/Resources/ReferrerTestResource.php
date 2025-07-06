<?php

namespace App\Domains\Referrer\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferrerTestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'price' => $this->price,
            'methods' => $this->methods,
            'test' => $this->test,
            "price_type" => $this->price_type,
            "extra" => $this->extra
        ];
    }
}
