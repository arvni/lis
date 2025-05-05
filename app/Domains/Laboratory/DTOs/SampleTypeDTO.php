<?php

namespace App\Domains\Laboratory\DTOs;

class SampleTypeDTO
{
    public function __construct(
        public string $name,
        public string $description
    )
    {
    }

    public function toArray()
    {
        return [
            "name" => $this->name,
            "description" => $this->description
        ];
    }
}
