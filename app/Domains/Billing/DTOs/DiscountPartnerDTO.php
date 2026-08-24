<?php

declare(strict_types=1);

namespace App\Domains\Billing\DTOs;

class DiscountPartnerDTO
{
    /**
     * @param  array<string, mixed>|null  $contact
     * @param  list<array<string, mixed>>  $offers
     */
    public function __construct(
        public string $name,
        public ?string $contract_no = null,
        public ?array $contact = null,
        public ?string $starts_at = null,
        public ?string $ends_at = null,
        public bool $active = true,
        public ?string $notes = null,
        public array $offers = [],
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            $data['name'],
            $data['contract_no'] ?? null,
            $data['contact'] ?? null,
            $data['starts_at'] ?? null,
            $data['ends_at'] ?? null,
            (bool) ($data['active'] ?? true),
            $data['notes'] ?? null,
            $data['offers'] ?? [],
        );
    }

    /**
     * Persistable columns only — `offers` is a relation and is synced separately.
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'contract_no' => $this->contract_no,
            'contact' => $this->contact,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'active' => $this->active,
            'notes' => $this->notes,
        ];
    }
}
