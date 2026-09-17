<?php

declare(strict_types=1);

namespace App\Domains\Payroll\DTOs;

use App\Domains\Payroll\Enums\AllowanceKind;

final readonly class PayrollItemTypeDTO
{
    public function __construct(
        public string $name,
        public AllowanceKind $kind,
        public ?string $defaultAmount,
        public bool $isActive,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $default = $data['default_amount'] ?? null;

        return new self(
            (string) $data['name'],
            AllowanceKind::from((string) $data['kind']),
            $default === null || $default === '' ? null : (string) $default,
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
            'kind' => $this->kind->value,
            'default_amount' => $this->defaultAmount,
            'is_active' => $this->isActive,
        ];
    }
}
