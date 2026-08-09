<?php

declare(strict_types=1);

namespace App\Domains\Reception\Services;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Reception\Adapters\LaboratoryAdapter;
use App\Domains\Reception\Adapters\ReferrerAdapter;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Repositories\AcceptanceItemConversionRepository;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Shared\Helpers\AmountDistributor;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AcceptanceItemConversionService
{
    /**
     * Price resolved from a test-level tier. Every MethodTest of a PANEL carries
     * the panel's own test_id, so such a price is the panel's total, not one
     * item's share.
     */
    private const SCOPE_TEST = 'test';

    /** Price resolved from a method-level tier — already a per-item amount. */
    private const SCOPE_METHOD = 'method';

    public function __construct(
        private readonly AcceptanceItemRepository $acceptanceItemRepository,
        private readonly AcceptanceItemConversionRepository $conversionRepository,
        private readonly LaboratoryAdapter $laboratoryAdapter,
        private readonly ReferrerAdapter $referrerAdapter,
    ) {}

    /**
     * Eject all items in a panel back to their method's default individual MethodTest.
     * Clears panel_id, recalculates price using the item's stored custom parameters, logs conversion.
     */
    public function ejectPanel(AcceptanceItem $acceptanceItem): array
    {
        $items = $this->acceptanceItemRepository->getPanelItemsForConversion(
            $acceptanceItem->panel_id,
            $acceptanceItem->acceptance_id
        );

        $referrerId = $acceptanceItem->acceptance->referrer_id
            ?? $items->first()?->load('acceptance')->acceptance->referrer_id;

        $updated = [];

        DB::transaction(function () use ($items, $referrerId, &$updated) {
            foreach ($items as $item) {
                $method = $item->methodTest->method;
                $defaultMT = $this->laboratoryAdapter->findDefaultMethodTestForMethod($method->id);

                if (! $defaultMT) {
                    continue;
                }

                // Re-evaluate price using the item's own stored parameters
                $paramValues = $item->customParameters['price'] ?? [];

                $price = $this->calculatePrice(
                    $defaultMT->test_id,
                    $defaultMT->method_id,
                    $referrerId,
                    $paramValues
                );

                $fromMethodTestId = $item->method_test_id;

                $item->update([
                    'method_test_id' => $defaultMT->id,
                    'price' => $price,
                    'discount' => 0,
                    'panel_id' => null,
                ]);

                $this->logConversion($item->id, $fromMethodTestId, $defaultMT->id, 'eject_panel');

                $updated[] = $item->fresh();
            }
        });

        return $updated;
    }

    /**
     * Promote one or more test acceptance items into a panel.
     *
     * Matched items get their method_test updated to the panel MethodTest (matched by method_id).
     * New acceptance items are created for panel tests not covered by any selected item.
     * Custom price parameters from all selected items are merged and propagated to new items.
     *
     * @param  int[]  $acceptanceItemIds  IDs of the items being promoted.
     * @param  int[]  $panelMethodTestIds  All MethodTest IDs that form the target panel.
     * @return AcceptanceItem[]
     */
    public function promoteToPanel(array $acceptanceItemIds, array $panelMethodTestIds): array
    {
        $items = $this->acceptanceItemRepository->getByIdsWithConversionRelations($acceptanceItemIds);

        $referrerId = $items->first()?->acceptance?->referrer_id;
        $acceptanceId = $items->first()?->acceptance_id;
        $panelId = (string) Str::uuid();

        $panelMethodTests = $this->laboratoryAdapter
            ->getPanelMethodTests($panelMethodTestIds)
            ->keyBy('id');

        // Match each selected item to a panel MethodTest by method_id.
        // For PANEL type, all MethodTests share the same test_id (the panel itself),
        // so method_id is the correct discriminator for component test identity.
        $matchMap = [];
        foreach ($items as $item) {
            $match = $panelMethodTests->first(
                fn (MethodTest $mt) => $mt->method_id === $item->methodTest->method_id
            );
            if ($match) {
                $matchMap[$item->id] = $match;
            }
        }

        $coveredMethodIds = collect($matchMap)->map(fn ($mt) => $mt->method_id)->values()->all();

        // Collect and merge all price parameters from matched items so new panel items
        // inherit them and can have their prices calculated from the same inputs.
        $mergedParamValues = [];
        foreach ($items as $item) {
            $itemParams = $item->customParameters['price'] ?? [];
            $mergedParamValues = array_merge($mergedParamValues, $itemParams);
        }

        $results = [];

        DB::transaction(function () use (
            $items, $panelMethodTests, $matchMap, $coveredMethodIds,
            $panelId, $referrerId, $acceptanceId, $mergedParamValues, &$results
        ) {
            $allActiveSamples = collect();

            // Resolve every slot of the resulting panel before writing anything,
            // so a panel-level price can be split across the slots that share it
            // instead of being charged in full on each of them.
            $slots = [];

            foreach ($items as $item) {
                $match = $matchMap[$item->id] ?? null;

                $slots[] = [
                    'item' => $item,
                    'methodTest' => $match,
                    // Use the item's own stored price parameters for recalculation
                    'resolved' => $this->resolvePriceWithScope(
                        $match ? $match->test_id : $item->methodTest->test_id,
                        $match ? $match->method_id : $item->methodTest->method_id,
                        $referrerId,
                        $item->customParameters['price'] ?? []
                    ),
                ];
            }

            // Panel tests not covered by any selected item get a new acceptance
            // item, inheriting the merged price parameters so formulas can be
            // evaluated.
            foreach ($panelMethodTests as $mt) {
                if (in_array($mt->method_id, $coveredMethodIds)) {
                    continue;
                }

                $slots[] = [
                    'item' => null,
                    'methodTest' => $mt,
                    'resolved' => $this->resolvePriceWithScope(
                        $mt->test_id,
                        $mt->method_id,
                        $referrerId,
                        $mergedParamValues
                    ),
                ];
            }

            $prices = $this->splitPanelTotal($slots);

            // Retarget the selected items onto the panel.
            foreach ($slots as $index => $slot) {
                $item = $slot['item'];

                if (! $item) {
                    continue;
                }

                $match = $slot['methodTest'];
                $fromMTId = $item->method_test_id;
                $newMTId = $match ? $match->id : $fromMTId;

                $item->update([
                    'method_test_id' => $newMTId,
                    'price' => $prices[$index],
                    'discount' => 0,
                    'panel_id' => $panelId,
                ]);

                $this->logConversion($item->id, $fromMTId, $newMTId, 'promote_to_panel');
                $allActiveSamples = $allActiveSamples->merge($item->activeSamples);
                $results[] = $item->fresh();
            }

            $allActiveSamples = $allActiveSamples->unique('id');

            // Create the items for the panel tests no selected item covered.
            foreach ($slots as $index => $slot) {
                if ($slot['item']) {
                    continue;
                }

                $mt = $slot['methodTest'];

                $newItem = $this->acceptanceItemRepository->createPanelItem([
                    'acceptance_id' => $acceptanceId,
                    'method_test_id' => $mt->id,
                    'price' => $prices[$index],
                    'discount' => 0,
                    'panel_id' => $panelId,
                    'no_sample' => $mt->method->no_sample ?? 1,
                    'sampleless' => false,
                    'reportless' => false,
                    'customParameters' => ['price' => $mergedParamValues],
                    'timeline' => [
                        Carbon::now()->format('Y-m-d H:i:s') => 'Promoted to panel by '.auth()->user()?->name,
                    ],
                ]);

                $this->inheritSamples($newItem, $mt, $allActiveSamples);
                $results[] = $newItem->fresh();
            }
        });

        return $results;
    }

    /**
     * Turn the slots' resolved prices into the amount each item is stored with.
     *
     * A price that came from a test-level tier is the panel's total, because every
     * MethodTest of a PANEL shares the panel's test_id. The slots that resolved
     * that way therefore split the total between them — the same way a panel added
     * through the acceptance form does — while slots priced from a method-level
     * tier keep the amount they resolved.
     *
     * @param  array<int, array{resolved: array{price: float, scope: string}}>  $slots
     * @return array<int, float>
     */
    private function splitPanelTotal(array $slots): array
    {
        $prices = array_map(fn (array $slot): float => $slot['resolved']['price'], $slots);

        $sharedIndexes = array_keys(array_filter(
            $slots,
            fn (array $slot): bool => $slot['resolved']['scope'] === self::SCOPE_TEST
                && $slot['resolved']['price'] > 0
        ));

        if (count($sharedIndexes) < 2) {
            return $prices;
        }

        // These slots all resolved the same panel-level price and only differ when
        // an item carries its own formula parameters, so the first one stands for
        // the panel total.
        $shares = AmountDistributor::distribute(
            $prices[$sharedIndexes[0]],
            count($sharedIndexes),
            AmountDistributor::PRICE_DECIMALS
        );

        foreach ($sharedIndexes as $shareIndex => $slotIndex) {
            $prices[$slotIndex] = $shares[$shareIndex];
        }

        return $prices;
    }

    private function calculatePrice(int $testId, int $methodId, ?int $referrerId, array $paramValues = []): float
    {
        return $this->resolvePriceWithScope($testId, $methodId, $referrerId, $paramValues)['price'];
    }

    /**
     * Full pricing cascade, reporting which tier the price came from so callers
     * can tell a panel total (test-level) from a per-item amount (method-level):
     *   Referrer path:
     *     1. Per-method entry in ReferrerTest.methods (FIX / FORMULATE / CONDITIONAL)
     *     2. ReferrerTest test-level price
     *     3. Test.referrer_price / Test.referrer_extra
     *     4. Method.referrer_price / Method.referrer_extra
     *   Individual path:
     *     5. Test.price / Test.extra
     *     6. Method.price / Method.extra
     *
     * @return array{price: float, scope: string}
     */
    private function resolvePriceWithScope(int $testId, int $methodId, ?int $referrerId, array $paramValues = []): array
    {
        $test = $this->laboratoryAdapter->findTest($testId);
        $method = $this->laboratoryAdapter->findMethod($methodId);

        if ($referrerId) {
            $referrerTest = $this->referrerAdapter->findReferrerTest($referrerId, $testId);

            if ($referrerTest) {
                $methods = $referrerTest->methods ?? [];
                $methodIds = array_column($methods, 'method_id');
                $methodMatches = empty($methods) || in_array($methodId, $methodIds);

                if ($methodMatches) {
                    // 1. Per-method entry on ReferrerTest
                    $methodEntry = collect($methods)->first(
                        fn ($m) => ($m['method_id'] ?? null) == $methodId
                    );
                    if ($methodEntry) {
                        $price = $this->resolvePrice(
                            $methodEntry['price_type'] ?? null,
                            $methodEntry['price'] ?? 0,
                            $methodEntry['extra'] ?? [],
                            $paramValues
                        );
                        if ($price > 0) {
                            return ['price' => $price, 'scope' => self::SCOPE_METHOD];
                        }
                    }

                    // 2. ReferrerTest test-level price
                    $price = $this->resolvePrice(
                        $referrerTest->price_type,
                        $referrerTest->price,
                        $referrerTest->extra ?? [],
                        $paramValues
                    );
                    if ($price > 0) {
                        return ['price' => $price, 'scope' => self::SCOPE_TEST];
                    }
                }
            }

            // 3. Test referrer price
            if ($test) {
                $price = $this->resolvePrice(
                    $test->referrer_price_type,
                    $test->referrer_price,
                    $test->referrer_extra ?? [],
                    $paramValues
                );
                if ($price > 0) {
                    return ['price' => $price, 'scope' => self::SCOPE_TEST];
                }
            }

            // 4. Method referrer price
            if ($method) {
                $price = $this->resolvePrice(
                    $method->referrer_price_type,
                    $method->referrer_price,
                    $method->referrer_extra ?? [],
                    $paramValues
                );
                if ($price > 0) {
                    return ['price' => $price, 'scope' => self::SCOPE_METHOD];
                }
            }
        }

        // 5. Test individual price
        if ($test) {
            $price = $this->resolvePrice(
                $test->price_type,
                $test->price,
                $test->extra ?? [],
                $paramValues
            );
            if ($price > 0) {
                return ['price' => $price, 'scope' => self::SCOPE_TEST];
            }
        }

        // 6. Method individual price
        if ($method) {
            $price = $this->resolvePrice(
                $method->price_type,
                $method->price,
                $method->extra ?? [],
                $paramValues
            );
            if ($price > 0) {
                return ['price' => $price, 'scope' => self::SCOPE_METHOD];
            }
        }

        // Nothing resolved — scope is irrelevant, but a zero must never claim a
        // share of a panel total.
        return ['price' => 0.0, 'scope' => self::SCOPE_METHOD];
    }

    /**
     * Resolve a price value from a price_type + static price + extra config.
     * FIX   → static price
     * FORMULATE   → evaluate formula with param values
     * CONDITIONAL → find first matching condition and evaluate its value expression
     */
    private function resolvePrice(mixed $priceType, mixed $staticPrice, array $extra, array $paramValues): float
    {
        $type = $priceType instanceof MethodPriceType
            ? $priceType
            : MethodPriceType::tryFrom((string) $priceType);

        return match ($type) {
            MethodPriceType::FIX => (float) $staticPrice,
            MethodPriceType::FORMULATE => $this->evalFormula(
                $extra['formula'] ?? '',
                $extra['parameters'] ?? [],
                $paramValues
            ),
            MethodPriceType::CONDITIONAL => $this->evalConditional(
                $extra['conditions'] ?? [],
                $extra['parameters'] ?? [],
                $paramValues
            ),
            default => (float) $staticPrice,
        };
    }

    /**
     * Evaluate a math formula by substituting parameter names with their values.
     * Parameters schema: [{value: 'weight', ...}, ...]
     * paramValues: ['weight' => 75, ...]
     */
    private function evalFormula(string $formula, array $paramSchema, array $paramValues): float
    {
        if (blank($formula)) {
            return 0.0;
        }

        $expression = $this->substituteParams($formula, $paramSchema, $paramValues);

        if (! $this->isSafeExpression($expression)) {
            return 0.0;
        }

        try {
            $result = eval("return (float)({$expression});");

            return is_numeric($result) ? (float) $result : 0.0;
        } catch (\Throwable) {
            return 0.0;
        }
    }

    /**
     * Evaluate conditional pricing: iterate conditions until one matches, then evaluate its value expression.
     */
    private function evalConditional(array $conditions, array $paramSchema, array $paramValues): float
    {
        foreach ($conditions as $condition) {
            $condExpr = $this->substituteParams($condition['condition'] ?? '', $paramSchema, $paramValues);
            $valueExpr = $this->substituteParams($condition['value'] ?? '', $paramSchema, $paramValues);

            if (! $this->isSafeCondition($condExpr) || ! $this->isSafeExpression($valueExpr)) {
                continue;
            }

            try {
                $matches = eval("return (bool)({$condExpr});");
                if ($matches) {
                    $result = eval("return (float)({$valueExpr});");

                    return is_numeric($result) ? (float) $result : 0.0;
                }
            } catch (\Throwable) {
                continue;
            }
        }

        return 0.0;
    }

    /**
     * Replace each parameter name in an expression with its numeric value.
     * Sorted by name length descending to avoid partial replacements.
     */
    private function substituteParams(string $expression, array $paramSchema, array $paramValues): string
    {
        // Sort longest names first to prevent shorter names replacing substrings of longer ones
        usort($paramSchema, fn ($a, $b) => strlen((string) ($b['value'] ?? '')) - strlen((string) ($a['value'] ?? '')));

        foreach ($paramSchema as $param) {
            $name = (string) ($param['value'] ?? '');
            if ($name === '') {
                continue;
            }
            $value = (float) ($paramValues[$name] ?? 0);
            $expression = preg_replace(
                '/\b'.preg_quote($name, '/').'\b/',
                (string) $value,
                $expression
            );
        }

        return trim($expression);
    }

    /** Allow only numeric math expressions (no function calls, no strings). */
    private function isSafeExpression(string $expr): bool
    {
        return (bool) preg_match('/^[\d\s+\-*\/().]+$/', $expr);
    }

    /** Allow numeric + comparison + logical operators for condition strings. */
    private function isSafeCondition(string $expr): bool
    {
        // Allow: digits, spaces, arithmetic, comparison (< > <= >= == !=), logical (&& ||), parens
        return (bool) preg_match('/^[\d\s+\-*\/().&|<>=!]+$/', $expr);
    }

    /**
     * Attach any of the original item's active samples whose sample_type matches
     * a sample type accepted by the new item's test.
     */
    private function inheritSamples(AcceptanceItem $newItem, MethodTest $mt, Collection $activeSamples): void
    {
        if ($activeSamples->isEmpty()) {
            return;
        }

        $acceptedTypeIds = $mt->test->sampleTypes->pluck('id')->toArray();

        foreach ($activeSamples as $sample) {
            if (in_array($sample->sample_type_id, $acceptedTypeIds)) {
                $newItem->samples()->attach($sample->id, ['active' => true]);
            }
        }
    }

    private function logConversion(int $itemId, int $fromMTId, int $toMTId, string $type): void
    {
        $this->conversionRepository->create([
            'acceptance_item_id' => $itemId,
            'from_method_test_id' => $fromMTId,
            'to_method_test_id' => $toMTId,
            'conversion_type' => $type,
            'converted_by' => auth()->id(),
            'converted_at' => now(),
        ]);
    }
}
