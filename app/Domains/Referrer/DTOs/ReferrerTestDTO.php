<?php

namespace App\Domains\Referrer\DTOs;

class ReferrerTestDTO
{
    public function __construct(
        public ?float $price = null,
        public ?int $referrerId = null,
        public ?int $testId = null,
        public ?array $methods = [],
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            price: $data['price'] ?? null,
            referrerId: $data['referrer']["id"] ?? null,
            testId: $data['test']["id"] ?? null,
            methods: $data['methods'] ?? null
        );
    }


    public function toArray(): array
    {
        return array_filter([
            'price' => $this->price,
            'referrer_id' => $this->referrerId,
            'test_id' => $this->testId,
            'methods' => $this->methods
        ], fn($value) => $value !== null);
    }
}
