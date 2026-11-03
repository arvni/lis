<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Adapters;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Repositories\MethodTestRepository;
use App\Domains\Laboratory\Repositories\TestRepository;
use App\Domains\Referrer\Repositories\ReferrerTestRepository;
use App\Domains\Shared\Helpers\PriceFormula;

/**
 * The PreOrder domain's view of the test catalogue: which tests take pre-orders, their flow,
 * and what a line costs a given center.
 */
class LaboratoryAdapter
{
    public function __construct(
        private readonly TestRepository $testRepository,
        private readonly ReferrerTestRepository $referrerTestRepository,
        private readonly MethodTestRepository $methodTests,
    ) {}

    public function findTest(int $id): ?Test
    {
        return $this->testRepository->findTestById($id);
    }

    public function flowIdOf(Test $test): ?int
    {
        return $test->flow_id;
    }

    /** A test that only rides along (e.g. a parental karyotype) can't set the flow. */
    public function canBeMain(Test $test): bool
    {
        return (bool) ($test->preorder['can_be_main'] ?? true);
    }

    /**
     * The questions a center answers for this test, and which answers raise the price.
     *
     * @return list<array{key: string, label: string, type: string, needs_finance: bool, threshold: int|null}>
     */
    public function scopeFields(Test $test): array
    {
        return array_values($test->preorder['scope'] ?? []);
    }

    /** A panel is priced as a whole; any other test is priced by the method BION picks. */
    public function needsMethod(Test $test): bool
    {
        return $test->type !== TestType::PANEL;
    }

    /**
     * The methods BION can pick for a test, for its screen only: the center never sees them.
     *
     * @return list<array{id: int, name: string}>
     */
    public function methodOptions(Test $test): array
    {
        if (! $this->needsMethod($test)) {
            return [];
        }

        return $this->methodTests->activeForTest($test->id)
            ->map(fn (MethodTest $mt) => ['id' => $mt->id, 'name' => $mt->method->name])
            ->values()->all();
    }

    /**
     * The method choices for several tests, keyed by test id; panels get none.
     *
     * @param  iterable<Test>  $tests
     * @return array<int, list<array{id: int, name: string}>>
     */
    public function methodOptionsFor(iterable $tests): array
    {
        $ids = [];
        foreach ($tests as $test) {
            if ($this->needsMethod($test)) {
                $ids[] = $test->id;
            }
        }
        if ($ids === []) {
            return [];
        }

        return $this->methodTests->activeForTests(array_values(array_unique($ids)))
            ->groupBy('test_id')
            ->map(fn ($methods) => $methods->map(fn (MethodTest $mt) => ['id' => $mt->id, 'name' => $mt->method->name])->values()->all())
            ->all();
    }

    /** The method a new line starts with: the test's only active method, or none to pick yet. */
    public function defaultMethodTest(Test $test): ?MethodTest
    {
        if (! $this->needsMethod($test)) {
            return null;
        }
        $methods = $this->methodTests->activeForTest($test->id);

        return $methods->count() === 1 ? $methods->first() : null;
    }

    /** One of this test's active methods, or null when it isn't. */
    public function methodTestFor(Test $test, int $methodTestId): ?MethodTest
    {
        return $this->methodTests->activeForTest($test->id)->firstWhere('id', $methodTestId);
    }

    /**
     * What a line costs this center, in the order the lab prices a referrer's acceptance
     * (Reception's AcceptanceItemConversionService):
     *   1. the center's price for the chosen method (referrer_tests.methods)
     *   2. the center's price for the test (referrer_tests.price)
     *   3. the test's referrer price (panels)
     *   4. the method's referrer price
     *   5. the test's list price, then 6. the method's list price
     * The center's own prices apply only to the methods it lists (or to all, when it lists none).
     *
     * A formula or conditional price needs values such as the number of embryos: without them the
     * line stays unpriced until BION enters them on the quotation (see priceRule()). With no
     * method picked yet, only the test-level prices apply; picking one reprices the line.
     *
     * @param  array<string, mixed>  $values  parameter name => value, for a formula or conditions
     */
    public function unitPrice(Test $test, int $referrerId, ?MethodTest $methodTest = null, array $values = []): ?string
    {
        $tier = $this->decisiveTier($test, $referrerId, $methodTest);
        if ($tier === null) {
            return null;
        }
        if ($tier['parameters'] === null) {
            return $tier['price'];
        }
        // A rule with no inputs (a constant formula) needs nothing entered.
        if ($values === [] && $tier['parameters'] !== []) {
            return null;
        }
        $price = PriceFormula::resolve($tier['type'], 0, $tier['extra'], $values);

        return $price > 0 ? number_format($price, 3, '.', '') : null;
    }

    /**
     * How a line is priced when the catalogue sets it by a formula or conditions: the values BION
     * enters and the rule they feed, for the quotation form. Null for a fixed price, or none.
     *
     * @return array{type: string, parameters: list<string>, formula: string|null, conditions: list<array<string, mixed>>}|null
     */
    public function priceRule(Test $test, int $referrerId, ?MethodTest $methodTest = null): ?array
    {
        $tier = $this->decisiveTier($test, $referrerId, $methodTest);
        if ($tier === null || $tier['parameters'] === null) {
            return null;
        }

        return [
            'type' => $tier['type'],
            'parameters' => $tier['parameters'],
            'formula' => isset($tier['extra']['formula']) ? (string) $tier['extra']['formula'] : null,
            'conditions' => array_values(array_filter((array) ($tier['extra']['conditions'] ?? []), 'is_array')),
        ];
    }

    /**
     * The first price setting in the cascade that decides the line: a fixed price above zero, or a
     * formula or conditions (whose price depends on values entered later).
     *
     * @return array{type: string, price: string|null, extra: array<string, mixed>, parameters: list<string>|null}|null
     */
    private function decisiveTier(Test $test, int $referrerId, ?MethodTest $methodTest): ?array
    {
        $method = $methodTest?->method;

        /** @var list<array{0: mixed, 1: mixed, 2: mixed}> $tiers */
        $tiers = [];
        $referrerTest = $this->referrerTestRepository->findByReferrerIdAndTestId($referrerId, $test->id);
        if ($referrerTest) {
            $methods = array_values(array_filter((array) ($referrerTest->methods ?? []), 'is_array'));
            if ($method === null || $methods === [] || in_array($method->id, array_map('intval', array_column($methods, 'method_id')), true)) {
                foreach ($method ? $methods : [] as $entry) {
                    if ((int) ($entry['method_id'] ?? 0) === $method->id) {
                        $tiers[] = [$entry['price_type'] ?? null, $entry['price'] ?? null, $entry['extra'] ?? []];
                    }
                }
                $tiers[] = [$referrerTest->price_type, $referrerTest->price, $referrerTest->extra ?? []];
            }
        }
        $tiers[] = [$test->referrer_price_type, $test->referrer_price, $test->referrer_extra ?? []];
        if ($method) {
            $tiers[] = [$method->referrer_price_type, $method->referrer_price, $method->referrer_extra ?? []];
        }
        $tiers[] = [$test->price_type, $test->price, $test->extra ?? []];
        if ($method) {
            $tiers[] = [$method->price_type, $method->price, $method->extra ?? []];
        }

        foreach ($tiers as [$type, $price, $extra]) {
            $type = $type instanceof MethodPriceType ? $type : MethodPriceType::tryFrom((string) $type);
            if ($type === null || $type === MethodPriceType::FIX) {
                if ((float) $price > 0) {
                    return ['type' => MethodPriceType::FIX->value, 'price' => (string) $price, 'extra' => [], 'parameters' => null];
                }

                continue;
            }
            // Set up as a formula or conditions: that is this line's price, worked out from values.
            $extra = is_array($extra) ? $extra : [];
            if (! empty($extra['formula']) || ! empty($extra['conditions'])) {
                return ['type' => $type->value, 'price' => null, 'extra' => $extra, 'parameters' => PriceFormula::parameters($extra)];
            }
        }

        return null;
    }
}
