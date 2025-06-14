<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderMaterialResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->id,
            "sample_type_id" => $this->sample_type_id,
            "sample_type_name" => $this->sample_type_name,
            "referrer_full_name" => $this->referrer_fullname,
            "amount" => $this->amount,
            "server_id" => $this->server_id,
            "status" => $this->status,
            "materials" => $this->whenLoaded('materials', function () {
                $output = [];
                foreach ($this->materials as $material) {
                    $output[] = [
                        "id" => $material->id,
                        "barcode" => $material->barcode,
                    ];
                }
                return $output;
            })
        ];
    }
}
