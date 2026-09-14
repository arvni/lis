<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

class HolidayDTO
{
    public function __construct(
        public string $date,
        public string $title,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self($data['date'], $data['title']);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'date' => $this->date,
            'title' => $this->title,
        ];
    }
}
