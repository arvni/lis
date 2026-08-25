<?php

declare(strict_types=1);

namespace App\Domains\Billing\DTOs;

class IssueCardBatchDTO
{
    public function __construct(
        public int $quantity,
        /** Null mints stock: printable cards nobody has promised to a partner yet. */
        public ?int $discount_partner_id = null,
        public ?string $prefix = null,
        /** Pattern the numbers are minted from; null keeps the legacy series-serial format. */
        public ?string $number_template = null,
        /** Serials run from here, so a run can continue where the last one stopped. */
        public int $serial_from = 1,
        public ?string $expires_at = null,
        public ?int $usage_limit = null,
        public ?string $notes = null,
        /** Hand the cards out already live instead of activating them later. */
        public bool $activate_immediately = false,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            (int) $data['quantity'],
            isset($data['discount_partner_id']) && $data['discount_partner_id'] !== ''
                ? (int) $data['discount_partner_id']
                : null,
            $data['prefix'] ?? null,
            isset($data['number_template']) && trim((string) $data['number_template']) !== ''
                ? trim((string) $data['number_template'])
                : null,
            isset($data['serial_from']) && $data['serial_from'] !== '' ? (int) $data['serial_from'] : 1,
            $data['expires_at'] ?? null,
            isset($data['usage_limit']) && $data['usage_limit'] !== '' ? (int) $data['usage_limit'] : null,
            $data['notes'] ?? null,
            (bool) ($data['activate_immediately'] ?? false),
        );
    }
}
