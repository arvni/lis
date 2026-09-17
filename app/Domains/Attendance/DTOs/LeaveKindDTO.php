<?php

declare(strict_types=1);

namespace App\Domains\Attendance\DTOs;

class LeaveKindDTO
{
    public function __construct(
        public string $name,
        /** Unpaid leave is deducted on the salary slip; paid leave isn't. */
        public bool $isPaid,
        public bool $isActive,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['name'],
            (bool) ($data['is_paid'] ?? true),
            (bool) ($data['is_active'] ?? true),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'is_paid' => $this->isPaid,
            'is_active' => $this->isActive,
        ];
    }
}
