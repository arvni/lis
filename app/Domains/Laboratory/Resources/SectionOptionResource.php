<?php

namespace App\Domains\Laboratory\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SectionOptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param Request $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            "id" => $this->order,
            "order" => $this->order,
            "name" => $this->section_name
        ];
    }
}
