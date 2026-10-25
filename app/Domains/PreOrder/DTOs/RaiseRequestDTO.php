<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\DTOs;

use App\Domains\PreOrder\Enums\RequestType;
use Illuminate\Support\Carbon;

final readonly class RaiseRequestDTO
{
    /**
     * @param  list<RequestType>  $types
     * @param  array<string, mixed>|null  $needs
     * @param  list<array{test_id: int, patient_ref?: string|null, qty?: int|null}>  $tests  additional tests, for a test request
     */
    public function __construct(
        public array $types,
        public string $reason,
        public string $message,
        public bool $blocking = false,
        public ?array $needs = null,
        public ?Carbon $dueAt = null,
        public array $tests = [],
        /** The tests repeat work with new effort (e.g. another method), which is chargeable. */
        public bool $retest = false,
        /** Discount and prices for lines the catalogue can't price, keyed by test id. */
        public ?QuoteDTO $quote = null,
    ) {}

    /** @param  array<string, mixed>  $data */
    public static function fromArray(array $data): self
    {
        return new self(
            types: array_map(fn (string $t) => RequestType::from($t), array_values($data['types'])),
            reason: $data['reason'],
            message: $data['message'],
            blocking: (bool) ($data['blocking'] ?? false),
            needs: $data['needs'] ?? null,
            dueAt: isset($data['due_at']) ? Carbon::parse($data['due_at']) : null,
            tests: array_values($data['tests'] ?? []),
            retest: (bool) ($data['retest'] ?? false),
            quote: new QuoteDTO(
                discount: isset($data['discount']) ? (string) $data['discount'] : '0',
                prices: self::prices($data['tests'] ?? []),
            ),
        );
    }

    /**
     * Prices typed for tests the catalogue can't price, keyed by test id.
     *
     * @param  list<array<string, mixed>>  $tests
     * @return array<int, string>
     */
    private static function prices(array $tests): array
    {
        $prices = [];
        foreach ($tests as $test) {
            if (isset($test['unit_price'])) {
                $prices[(int) $test['test_id']] = (string) $test['unit_price'];
            }
        }

        return $prices;
    }
}
