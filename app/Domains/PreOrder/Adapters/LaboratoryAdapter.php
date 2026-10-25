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
     * Only fixed prices are used here. A formula or conditional price needs the values reception
     * enters, so the line stays unpriced and BION's finance team prices it on the quotation.
     * With no method picked yet, only the test-level prices apply; picking one reprices the line.
     */
    public function unitPrice(Test $test, int $referrerId, ?MethodTest $methodTest = null): ?string
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
                    return (string) $price;
                }

                continue;
            }
            // Set up as a formula or conditions: that is this line's price, but not one to guess.
            $extra = is_array($extra) ? $extra : [];
            if (! empty($extra['formula']) || ! empty($extra['conditions'])) {
                return null;
            }
        }

        return null;
    }
}
