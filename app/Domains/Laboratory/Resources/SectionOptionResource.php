<?php

namespace App\Domains\Laboratory\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int $order
 * @property string $section_name
 */
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
