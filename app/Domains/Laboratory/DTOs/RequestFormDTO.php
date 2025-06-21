<?php

namespace App\Domains\Laboratory\DTOs;

class RequestFormDTO
{
    public function __construct(
        public string $name,
        public array  $formData,
        public ?array $document,
        public ?bool  $isActive = false,
    )
    {
    }

    public function toArray()
    {
        return [
            'name' => $this->name,
            'form_data' => $this->formData,
            'is_active' => $this->isActive,
        ];
    }
}
