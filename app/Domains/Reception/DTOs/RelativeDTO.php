<?php

namespace App\Domains\Reception\DTOs;

class RelativeDTO
{
    public function __construct(
        public int    $patientId,
        public int    $relativeId,
        public array|string $relationship,
    )
    {
    }

    public function toArray()
    {
        return [
            "patient_id" => $this->patientId,
            "relative_id" => $this->relativeId,
            "relationship" => $this->relationship,
        ];
    }

}
