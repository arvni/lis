<?php

namespace App\Domains\Laboratory\DTOs;

class BarcodeGroupDTO
{
    public function __construct(
        public string $name,
        public string $abbr
    )
    {
    }

    public function toArray(): array
    {
        return [
            "name" => $this->name,
            "abbr" => $this->abbr
        ];
    }
}
