<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

class ShiftDTO
{
    /**
     * @param  list<array{weekday: int, start_time: string, end_time: string}>  $days  working weekdays only
     */
    public function __construct(
        public string $name,
        public ?string $description,
        public bool $isActive,
        public array $days,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['name'],
            $data['description'] ?? null,
            (bool) ($data['is_active'] ?? true),
            array_values(array_map(
                fn (array $day) => [
                    'weekday' => (int) $day['weekday'],
                    'start_time' => $day['start_time'],
                    'end_time' => $day['end_time'],
                ],
                $data['days'],
            )),
        );
    }

    /**
     * Persistable shift columns only — the weekly days are replaced separately.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'is_active' => $this->isActive,
        ];
    }
}
