<?php

namespace App\Domains\Reception\DTOs;

class PatientMetaDTO
{
    public function __construct(
        public ?bool   $maritalStatus,
        public ?string $company,
        public ?string $profession,
        public ?string $email,
        public ?string $address,
        public ?string $details,
    )
    {
    }

    public function toArray(): array
    {
        return [
            'maritalStatus' => $this->maritalStatus,
            'company' => $this->company,
            'profession' => $this->profession,
            'email' => $this->email,
            'address' => $this->address,
            'details' => $this->details,
        ];
    }
}
