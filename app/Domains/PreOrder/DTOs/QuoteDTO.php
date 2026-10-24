<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\DTOs;

/**
 * BION's part of a quotation: a short note to the center, an optional discount, and a price for
 * any line the catalogue can't price (a formula or conditional price). Catalogue prices are
 * never typed over.
 */
final readonly class QuoteDTO
{
    /** @param  array<int, string>  $prices  item id => unit price */
    public function __construct(
        public ?string $reason = null,
        public string $discount = '0',
        public array $prices = [],
    ) {}

    /** @param  array<string, mixed>  $data */
    public static function fromArray(array $data): self
    {
        $prices = [];
        foreach ($data['prices'] ?? [] as $line) {
            $prices[(int) $line['item_id']] = (string) $line['unit_price'];
        }

        return new self(
            reason: $data['reason'] ?? null,
            discount: isset($data['discount']) ? (string) $data['discount'] : '0',
            prices: $prices,
        );
    }

    public function hasFinanceInput(): bool
    {
        return bccomp($this->discount, '0', 3) !== 0 || $this->prices !== [];
    }
}
