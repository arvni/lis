<?php

namespace App\Domains\Consultation\DTOs;

class CustomerDTO
{
    public function __construct(
        public string  $name,
        public string  $phone,
        public ?string $email = null,
        public ?int    $patientID = null,
    )
    {
    }

    public function toArray(): array
    {
        return [
            "name" => $this->name,
            "phone" => $this->phone,
            "email" => $this->email,
            "patient_id" => $this->patientID
        ];
    }
}
