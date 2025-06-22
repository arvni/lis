<?php

namespace App\Domains\Laboratory\DTOs;

class ConsentFormDTO
{
    public function __construct(
        public string $name,
        public array  $document,
        public ?bool  $isActive = true,
    )
    {
    }

    public function toArray()
    {
        return [
            "name" => $this->name,
            "is_active" => $this->isActive
        ];
    }
}
