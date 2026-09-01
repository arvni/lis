<?php

declare(strict_types=1);

namespace App\Domains\Inventory\DTOs;

/**
 * A request to move stock that is already on hand to another place.
 * Quantity is always in base units — relocation never changes how much is held.
 */
class RelocateStockDTO
{
    public function __construct(
        public float $quantity_base_units,
        public int $to_store_id,
        public ?int $to_store_location_id = null,
        public ?string $notes = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            (float) ($data['quantity_base_units'] ?? 0),
            (int) ($data['to_store_id'] ?? 0),
            isset($data['to_store_location_id']) && $data['to_store_location_id'] !== ''
                ? (int) $data['to_store_location_id']
                : null,
            isset($data['notes']) && $data['notes'] !== '' ? (string) $data['notes'] : null,
        );
    }
}
