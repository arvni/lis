<?php

declare(strict_types=1);

namespace App\Domains\Inventory\DTOs;

/**
 * What a recalculation found for one item in one store.
 */
class StockReconciliationLineDTO
{
    public function __construct(
        public int $store_id,
        public string $store_name,
        public float $previous,
        public float $expected,
        public float $difference,
        public bool $corrected,
    ) {}

    public function toArray(): array
    {
        return [
            'store_id' => $this->store_id,
            'store_name' => $this->store_name,
            'previous' => $this->previous,
            'expected' => $this->expected,
            'difference' => $this->difference,
            'corrected' => $this->corrected,
        ];
    }
}
