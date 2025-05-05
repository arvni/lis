<?php

namespace App\Domains\Laboratory\DTOs;

class DoctorDTO
{
    public function __construct(
        public string $name,
        public string $expertise,
        public string $phone,
        public string $licenseNo
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
