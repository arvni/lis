<?php

declare(strict_types=1);

namespace App\Domains\Billing\DTOs;

class IssueCardBatchDTO
{
    public function __construct(
        public int $discount_partner_id,
        public int $quantity,
        public ?string $prefix = null,
        public ?string $expires_at = null,
        public ?int $usage_limit = null,
        public ?string $notes = null,
        /** Hand the cards out already live instead of activating them later. */
        public bool $activate_immediately = false,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            (int) $data['discount_partner_id'],
            (int) $data['quantity'],
            $data['prefix'] ?? null,
            $data['expires_at'] ?? null,
            isset($data['usage_limit']) && $data['usage_limit'] !== '' ? (int) $data['usage_limit'] : null,
            $data['notes'] ?? null,
            (bool) ($data['activate_immediately'] ?? false),
        );
    }
}
