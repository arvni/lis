<?php

namespace App\Domains\Consultation\DTOs;

class ConsultantDTO
{
    public function __construct(
        public int               $userId,
        public string            $name,
        public ?string           $title = null,
        public ?string           $speciality = null,
        public array|string|null $avatar = null,
        public ?array            $defaultTimeTable = null,
        public bool              $active = true,
    )
    {
    }

    public function toArray(): array
    {
        return [
            "user_id" => $this->userId,
            "name" => $this->name,
            "title" => $this->title,
            "speciality" => $this->speciality,
            "avatar" => $this->avatar,
            "default_time_table" => $this->defaultTimeTable,
            "active" => $this->active,

        ];
    }
}
