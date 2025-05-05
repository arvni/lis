<?php

namespace App\Domains\Referrer\DTOs;

class ReferrerDTO
{
    public function __construct(
        public string       $fullName,
        public string       $email,
        public string       $phoneNo,
        public string|array $billingInfo,
        public bool         $isActive = true
    )
    {
    }

    public function toArray(): array
    {
        return [
            "fullName" => $this->fullName,
            "email" => $this->email,
            "phoneNo" => $this->phoneNo,
            "billingInfo" => $this->billingInfo,
            "isActive" => $this->isActive,
        ];
    }
}
