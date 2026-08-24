<?php

declare(strict_types=1);

namespace App\Domains\Billing\DTOs;

use App\Domains\Billing\Models\DiscountCard;

/**
 * The verdict on a scanned card. Phase 1 uses it for the public verify page;
 * reception will use the same verdict when attaching a card to an acceptance.
 */
final readonly class CardValidityDTO
{
    private function __construct(
        public bool $valid,
        public ?string $reason,
        public ?DiscountCard $card,
    ) {}

    public static function valid(DiscountCard $card): self
    {
        return new self(true, null, $card);
    }

    public static function invalid(string $reason, ?DiscountCard $card = null): self
    {
        return new self(false, $reason, $card);
    }
}
