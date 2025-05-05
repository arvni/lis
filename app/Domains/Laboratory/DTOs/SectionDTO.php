<?php

namespace App\Domains\Laboratory\DTOs;

class SectionDTO
{
    public function __construct(
        public string $name,
        public bool   $active,
        public int   $SectionGroupId,
        public string $description,
        public ?string $icon
    )
    {
    }

    public function toArray()
    {
        return [
            "name" => $this->name,
            "active" => $this->active,
            "section_group_id" => $this->SectionGroupId,
            "description" => $this->description,
            "icon" => $this->icon
        ];
    }
}
