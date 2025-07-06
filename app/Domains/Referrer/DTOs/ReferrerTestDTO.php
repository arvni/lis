<?php

namespace App\Domains\Referrer\DTOs;

use App\Domains\Laboratory\Enums\MethodPriceType;

class ReferrerTestDTO
{
    public function __construct(
        public ?float           $price = null,
        public ?int             $referrerId = null,
        public ?int             $testId = null,
        public ?array           $methods = [],
        public ?MethodPriceType $priceType = MethodPriceType::FIX,
        public ?array           $extra = null
    )
    {
    }

    public static function fromRequest(array $data): self
    {
        return new self(
            price: $data['price'] ?? null,
            referrerId: $data['referrer']["id"] ?? null,
            testId: $data['test']["id"] ?? null,
            methods: $data['methods'] ?? null,
            priceType: ($data['price_type']??null) ? MethodPriceType::find($data['price_type']) : null,
            extra: $data['extra'] ?? null
        );
    }


    public function toArray(): array
    {
        return array_filter([
            'price' => $this->price,
            'referrer_id' => $this->referrerId,
            'test_id' => $this->testId,
            'methods' => $this->methods,
            'price_type' => $this->priceType,
            'extra' => $this->extra,
        ], fn($value) => $value !== null);
    }
}
