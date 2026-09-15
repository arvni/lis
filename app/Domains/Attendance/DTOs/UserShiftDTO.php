<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

class UserShiftDTO
{
    public function __construct(
        public int $shiftId,
        public string $effectiveFrom,
        public ?string $effectiveTo = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            (int) $data['shift_id'],
            $data['effective_from'],
            $data['effective_to'] ?? null,
        );
    }
}
