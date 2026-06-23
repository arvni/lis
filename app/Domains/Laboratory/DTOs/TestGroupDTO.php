<?php

namespace App\Domains\Laboratory\DTOs;

class TestGroupDTO
{
    public function __construct(
        public string $name,
    )
    {
    }

    public function toArray(): array
    {
        return [
            "name" => $this->name,
        ];
    }
}
