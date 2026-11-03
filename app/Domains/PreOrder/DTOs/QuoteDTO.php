<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\DTOs;

/**
 * BION's part of a quotation: a short note to the center, an optional discount, the values a
 * formula or conditional price is worked out from (e.g. the number of embryos), and a typed price
 * for any line the catalogue can't price at all. Catalogue prices are never typed over.
 */
final readonly class QuoteDTO
{
    /**
     * @param  array<int, string>  $prices  item id => unit price
     * @param  array<int, array<string, float>>  $params  item id => parameter name => value
     */
    public function __construct(
        public ?string $reason = null,
        public string $discount = '0',
        public array $prices = [],
        public array $params = [],
    ) {}

    /** @param  array<string, mixed>  $data */
    public static function fromArray(array $data): self
    {
        $prices = [];
        foreach ($data['prices'] ?? [] as $line) {
            $prices[(int) $line['item_id']] = (string) $line['unit_price'];
        }

        $params = [];
        foreach ($data['params'] ?? [] as $line) {
            $params[(int) $line['item_id']] = array_map('floatval', (array) $line['values']);
        }

        return new self(
            reason: $data['reason'] ?? null,
            discount: isset($data['discount']) ? (string) $data['discount'] : '0',
            prices: $prices,
            params: $params,
        );
    }

    public function hasFinanceInput(): bool
    {
        return bccomp($this->discount, '0', 3) !== 0 || $this->prices !== [];
    }
}
