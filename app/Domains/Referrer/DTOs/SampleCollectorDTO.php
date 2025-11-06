<?php

namespace App\Domains\Referrer\DTOs;

class SampleCollectorDTO
{
    public function __construct(
        public string $name,
        public string $email
    )
    {
    }

    public function toArray(): array
    {
        return [
            "name" => $this->name,
            "email" => $this->email,
        ];
    }
}
