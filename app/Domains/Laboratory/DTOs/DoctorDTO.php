<?php

namespace App\Domains\Laboratory\DTOs;

class DoctorDTO
{
    public function __construct(
        public string $name,
        public ?string $expertise = null,
        public ?string $phone = null,
        public ?string $licenseNo = null
    )
    {
    }

    public function toArray()
    {
        return [
            "name" => $this->name,
            "expertise" => $this->expertise,
            "phone" => $this->phone,
            "licenseNo" => $this->licenseNo
        ];
    }
}
