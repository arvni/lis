<?php

namespace App\Domains\Document\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            "id" => $this->hash,
            "originalName" => $this->originalName,
            "progress" => 100,
            "tag" => $this->tag,
            "created_at"=>$this->created_at,
            "ext"=>$this->ext
        ];
    }
}
