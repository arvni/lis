<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

class AttendanceCorrectionDTO
{
    public function __construct(
        public ?string $checkIn,
        public ?string $checkOut,
        public string $note,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['check_in'] ?? null,
            $data['check_out'] ?? null,
            $data['note'],
        );
    }
}
