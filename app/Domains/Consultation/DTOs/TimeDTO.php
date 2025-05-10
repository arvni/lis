<?php

namespace App\Domains\Consultation\DTOs;

use DateTime;

class TimeDTO
{
    public function __construct(
        public string   $title,
        public int      $consultantID,
        public DateTime $startedAt,
        public DateTime $endedAt,
        public bool     $active = true,
        public ?string  $reservableType = null,
        public ?int     $reservableID = null,
    )
    {
    }

    public
    function toArray(): array
    {
        return [
            'title' => $this->title,
            'consultant_id' => $this->consultantID,
            'started_at' => $this->startedAt,
            'ended_at' => $this->endedAt,
            'active' => $this->active,
            'reservable_type' => $this->reservableType,
            'reservable_id' => $this->reservableID,
        ];
    }
}
