<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\Adapters\ReceptionAdapter;
use App\Domains\Billing\Adapters\ReferrerAdapter;
use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Shared\Helpers\PriceFormula;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InvoiceComposer
{
    public function __construct(
        private ReceptionAdapter $receptionAdapter,
        private ReferrerAdapter $referrerAdapter,
    ) {}

    /**
     * Rebuild invoice_items for the given invoice from its current acceptance_items.
     * Returns the number of invoice_items now active on the invoice.
     */
    public function recompose(Invoice $invoice, bool $force = false): int
    {
        if (! $force && $this->isLocked($invoice)) {
            return $invoice->invoiceItems()->count();
        }

        $invoice->loadMissing([
            'acceptances.acceptanceItems.methodTest.test',
            'acceptances.acceptanceItems.methodTest.method',
        ]);

        $acceptanceItems = $invoice->acceptances
            ->flatMap(fn($a) => $a->acceptanceItems)
            ->filter(fn($ai) => $ai->methodTest && $ai->methodTest->test);

        $buckets = $this->bucketize($acceptanceItems, $this->referrerChoicesFor($invoice, $acceptanceItems));
        // Include trashed rows so user-deletion tombstones (locked + soft-deleted) are matched
        // by key and can suppress regeneration of the line they represent.
        $allExisting = $invoice->invoiceItems()
            ->withTrashed()
            ->with(['test', 'acceptanceItems:id,invoice_item_id'])
            ->get()
            ->keyBy(fn($item) => $this->keyFor($item));

        return DB::transaction(function () use ($invoice, $buckets, $allExisting) {
            $keptIds = [];

            foreach ($buckets as $key => $bucket) {
                $item = $allExisting->get($key);

                if ($item && $item->trashed()) {
                    // Locked + trashed = a deliberate user deletion (tombstone): honor it and
                    // leave the line gone until "Rebuild from acceptance items" clears it.
                    if ($item->isLocked()) {
                        continue;
                    }
                    // Trashed but unlocked = leftover from a previous sweep: rebuild a fresh row.
                    $item = null;
                }

                // Locked items are user-managed: don't touch their fields.
                // Their bucket's acceptance_items still link to them so the totals make sense.
                if ($item && $item->isLocked()) {
                    $this->receptionAdapter->linkAcceptanceItemsToInvoiceItem($bucket['acceptance_item_ids'], $item->id);
                    $keptIds[] = $item->id;
                    continue;
                }

                $payload = $this->payloadFor($bucket);
                if ($item) {
                    $item->fill($payload)->save();
                } else {
                    $item = $invoice->invoiceItems()->create($payload);
                }

                $this->receptionAdapter->linkAcceptanceItemsToInvoiceItem($bucket['acceptance_item_ids'], $item->id);

                $keptIds[] = $item->id;
            }

            // Sweep unlocked, live items that no longer have a bucket. Locked items (manual fees,
            // user-deleted tombstones, paid invoices' rows) are always preserved.
            $allExisting
                ->reject(fn($item) => $item->trashed() || $item->isLocked() || in_array($item->id, $keptIds, true))
                ->each(fn($item) => $item->delete());

            return $invoice->invoiceItems()->count();
        });
    }

    public function lock(Invoice $invoice): void
    {
        $invoice->invoiceItems()->whereNull('locked_at')->update(['locked_at' => now()]);
    }

    /**
     * A settled invoice is frozen: nothing may recompose or re-discount it.
     */
    public function isLocked(Invoice $invoice): bool
    {
        if ($invoice->statement_id) {
            return true;
        }
        // invoices.status is stored (and read back) as a plain string — the model has
        // no enum cast — so normalise before comparing or this never matches.
        $status = $invoice->status instanceof InvoiceStatus
            ? $invoice->status
            : InvoiceStatus::tryFrom((string) $invoice->status);

        return in_array($status, [
            InvoiceStatus::PAID,
            InvoiceStatus::CREDIT_PAID,
            InvoiceStatus::CANCELED,
        ], true);
    }

    /**
     * Group acceptance_items into invoice_item buckets.
     * Panels group by panel_id (or by panel test when it may merge), mergeable tests group by
     * test_id, everything else is its own bucket.
     * A test or panel switched to "combine on invoice" puts every time it was added into one
     * line (qty 1) with its price parameters summed.
     * Buckets are scoped per acceptance so multi-acceptance invoices don't accidentally cross-merge.
     *
     * @param  array<int, array<int, array{test: bool, methods: array<int, bool>}>>  $referrerChoices
     *         acceptance_id => test_id => that referrer's price-list "combine on invoice" choices
     */
    private function bucketize(Collection $acceptanceItems, array $referrerChoices = []): array
    {
        $buckets = [];

        foreach ($acceptanceItems as $ai) {
            $test = $ai->methodTest->test;
            $kind = $this->kindFor($ai, $test);
            $combined = $this->combinesOnInvoice(
                $ai,
                $test,
                $kind,
                $referrerChoices[$ai->acceptance_id][$test->id] ?? null,
                array_key_exists($ai->acceptance_id, $referrerChoices),
            );
            $key = $combined
                ? "combined:{$ai->acceptance_id}:{$test->id}"
                : $this->keyForAcceptanceItem($ai, $test);

            if (! isset($buckets[$key])) {
                $buckets[$key] = [
                    'key'                  => $key,
                    'kind'                 => $kind,
                    'combined'             => $combined,
                    'acceptance_id'        => $ai->acceptance_id,
                    'test_id'              => $test->id,
                    'panel_id'             => $kind === InvoiceItemKind::PANEL ? $ai->panel_id : null,
                    'title'                => $test->fullName ?: $test->name,
                    'code'                 => $test->code,
                    'unit_price'           => (float) $ai->price,
                    'qty'                  => 0,
                    'price_sum'            => 0.0,
                    'discount_sum'         => 0.0,
                    'merged_panel'         => ! $combined && str_starts_with($key, 'panels:'),
                    // Each time a panel was added (its children share one panel_id).
                    'panel_ids'            => [],
                    'customParameters'     => $this->normalizeCustomParameters($ai->customParameters),
                    'acceptance_item_ids'  => [],
                    'first_acceptance_item'=> $ai,
                    // The test or panel additions whose parameters are already in the sum.
                    'summed_units'         => [$this->unitFor($ai, $kind)],
                ];
            } elseif ($combined) {
                $this->addParameters($buckets[$key], $ai);
            }

            if ($kind === InvoiceItemKind::PANEL) {
                $buckets[$key]['panel_ids'][(string) $ai->panel_id] = true;
            }
            $buckets[$key]['qty']++;
            $buckets[$key]['price_sum'] += (float) $ai->price;
            $buckets[$key]['discount_sum'] += (float) $ai->discount;
            $buckets[$key]['acceptance_item_ids'][] = $ai->id;
        }

        return $buckets;
    }

    private function payloadFor(array $bucket): array
    {
        $kind = $bucket['kind'];
        $combined = ! empty($bucket['combined']);
        $mergedPanel = ! empty($bucket['merged_panel']);
        $panelCount = max(1, count($bucket['panel_ids'] ?? []));
        $qty = match (true) {
            $combined                        => 1,
            $mergedPanel                     => $panelCount,
            $kind === InvoiceItemKind::PANEL => 1,
            $kind === InvoiceItemKind::TEST  => $bucket['qty'],
            default                          => $bucket['qty'],
        };

        // For panels: one row represents the whole panel; price is the sum of children, qty=1.
        // For combined tests/panels: one row for every time it was added, qty=1, price is sum.
        // For mergeable panels: qty=times the panel was added, unit_price=one panel's price.
        // For mergeable tests: qty=count, unit_price stays the per-item price, price is sum.
        // For singletons: qty=1, unit_price=item price.
        $unitPrice = match (true) {
            $mergedPanel                                   => round($bucket['price_sum'] / $panelCount, 3),
            $kind === InvoiceItemKind::PANEL || $combined  => $bucket['price_sum'],
            default                                        => $bucket['unit_price'],
        };

        $customParameters = $bucket['customParameters'];
        if ($combined) {
            // Marks the row so a later recompose matches it to the same combined line.
            $customParameters['combined'] = true;
        }

        $description = $this->descriptionFor($customParameters);

        return [
            'kind'             => $kind,
            'acceptance_id'    => $bucket['acceptance_id'],
            'test_id'          => $bucket['test_id'],
            'panel_id'         => $bucket['panel_id'],
            'title'            => $bucket['title'],
            'code'             => $bucket['code'],
            'description'      => $description ?: null,
            'unit_price'       => $unitPrice,
            'qty'              => $qty,
            'price'            => $bucket['price_sum'],
            'discount'         => $bucket['discount_sum'],
            'customParameters' => $customParameters ?: null,
        ];
    }

    /**
     * Each referred acceptance's referrer price-list choices, read in one query per referrer.
     *
     * @param  Collection<int, AcceptanceItem>  $acceptanceItems
     * @return array<int, array<int, array{test: bool, methods: array<int, bool>}>>
     */
    private function referrerChoicesFor(Invoice $invoice, Collection $acceptanceItems): array
    {
        $choices = [];
        foreach ($invoice->acceptances->filter(fn ($a) => $a->referrer_id !== null)->groupBy('referrer_id') as $referrerId => $acceptances) {
            $acceptanceIds = $acceptances->pluck('id')->map(fn ($id) => (int) $id)->all();
            $testIds = $acceptanceItems
                ->filter(fn ($ai) => in_array((int) $ai->acceptance_id, $acceptanceIds, true))
                ->map(fn ($ai) => (int) $ai->methodTest->test->id)
                ->unique()->values()->all();

            $forReferrer = $this->referrerAdapter->combineOnInvoiceChoices((int) $referrerId, $testIds);
            foreach ($acceptanceIds as $acceptanceId) {
                $choices[$acceptanceId] = $forReferrer;
            }
        }

        return $choices;
    }

    /**
     * Whether this test/panel is switched to "combine on invoice" on a price that applies to it:
     * a referred acceptance checks the referrer's own price list, the referrer default price and
     * the normal price; a patient checks the normal price only. Off unless someone switched it on.
     *
     * Panels are priced on the panel test, everything else on the item's method.
     *
     * @param  array{test: bool, methods: array<int, bool>}|null  $referrerList
     */
    private function combinesOnInvoice(
        AcceptanceItem $ai,
        Test $test,
        InvoiceItemKind $kind,
        ?array $referrerList,
        bool $referred,
    ): bool {
        $method = $ai->methodTest?->method;
        $isPanel = $kind === InvoiceItemKind::PANEL;
        $fromExtra = static fn (mixed $extra): bool => is_array($extra) && PriceFormula::combinesOnInvoice($extra);

        if ($referred) {
            if (! $isPanel && $method && ($referrerList['methods'][$method->id] ?? false)) {
                return true;
            }
            if ($referrerList['test'] ?? false) {
                return true;
            }
            if ($fromExtra($isPanel ? $test->referrer_extra : $method?->referrer_extra)) {
                return true;
            }
        }

        return $fromExtra($isPanel ? $test->extra : $method?->extra);
    }

    /**
     * One addition of the test or panel: a panel's children share one panel_id and carry the
     * same panel-level values, so the panel counts once; a test counts per acceptance item.
     */
    private function unitFor(AcceptanceItem $ai, InvoiceItemKind $kind): string
    {
        return $kind === InvoiceItemKind::PANEL ? "panel:{$ai->panel_id}" : "item:{$ai->id}";
    }

    /**
     * Add one more addition's price parameters into the combined line: numbers are summed
     * (5 + 4 embryos = 9); anything else keeps the first value entered.
     *
     * @param  array<string, mixed>  $bucket
     */
    private function addParameters(array &$bucket, AcceptanceItem $ai): void
    {
        $unit = $this->unitFor($ai, $bucket['kind']);
        if (in_array($unit, $bucket['summed_units'], true)) {
            return;
        }
        $bucket['summed_units'][] = $unit;

        $values = $this->normalizeCustomParameters($ai->customParameters)['price'] ?? [];
        if (! is_array($values)) {
            return;
        }

        $sums = $bucket['customParameters']['price'] ?? [];
        $sums = is_array($sums) ? $sums : [];
        foreach ($values as $name => $value) {
            if (! array_key_exists($name, $sums)) {
                $sums[$name] = $value;
            } elseif (is_numeric($sums[$name]) && is_numeric($value)) {
                $sums[$name] = $this->plainNumber((float) $sums[$name] + (float) $value);
            }
        }
        $bucket['customParameters']['price'] = $sums;
    }

    /** 9.0 → 9, 2.5 → 2.5, so the invoice shows "No Embryos=9". */
    private function plainNumber(float $number): int|float
    {
        return floor($number) === $number ? (int) $number : $number;
    }

    private function kindFor(AcceptanceItem $ai, Test $test): InvoiceItemKind
    {
        if ($ai->panel_id && $test->type === TestType::PANEL) {
            return InvoiceItemKind::PANEL;
        }
        return InvoiceItemKind::TEST;
    }

    /**
     * Key used both for new buckets and for matching existing invoice_items so updates
     * land on the same row instead of churning inserts.
     */
    private function keyForAcceptanceItem(AcceptanceItem $ai, Test $test): string
    {
        if ($ai->panel_id && $test->type === TestType::PANEL) {
            return ! empty($test->can_merge)
                ? "panels:{$ai->acceptance_id}:{$test->id}"
                : "panel:{$ai->acceptance_id}:{$ai->panel_id}";
        }
        if (! empty($test->can_merge)) {
            return "test:{$ai->acceptance_id}:{$test->id}";
        }
        return "single:{$ai->id}";
    }

    private function keyFor(InvoiceItem $item): string
    {
        $customParameters = $this->normalizeCustomParameters($item->customParameters);
        if (! empty($customParameters['combined'])) {
            return "combined:{$item->acceptance_id}:{$item->test_id}";
        }
        if ($item->kind === InvoiceItemKind::PANEL) {
            return $item->test && $item->test->can_merge
                ? "panels:{$item->acceptance_id}:{$item->test_id}"
                : "panel:{$item->acceptance_id}:{$item->panel_id}";
        }
        if ($item->kind === InvoiceItemKind::TEST && $item->test && $item->test->can_merge) {
            return "test:{$item->acceptance_id}:{$item->test_id}";
        }
        $aiId = $item->acceptanceItems->first()?->id;
        return $aiId ? "single:{$aiId}" : "item:{$item->id}";
    }

    /**
     * @param  array<string, mixed>|null  $customParameters
     */
    private function descriptionFor(?array $customParameters): string
    {
        $bits = [];
        $priceParams = $customParameters['price'] ?? [];
        if (! is_array($priceParams)) {
            return '';
        }
        foreach ($priceParams as $key => $value) {
            $key = (string) $key;
            $label = ucwords(trim((string) preg_replace('/(?<!^)[A-Z]/', ' $0', $key)));
            $value = is_scalar($value) ? (string) $value : (string) json_encode($value);
            $bits[] = "$label=$value";
        }
        return implode(', ', $bits);
    }

    /**
     * customParameters is cast to json on the model, but historical rows occasionally hold
     * a double-encoded string. Decode defensively so we never feed a string into array_*.
     */
    private function normalizeCustomParameters(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        return [];
    }
}
