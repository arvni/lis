<?php

namespace App\Domains\Laboratory\DTOs;

class SectionGroupDTO
{
    public function __construct(
        public string $name,
        public bool   $active,
        public ?int   $SectionGroupId = null
    )
    {
    }

    public function toArray()
    {
        return [
            "name" => $this->name,
            "active" => $this->active,
            "section_group_id" => $this->SectionGroupId
        ];
    }
}
