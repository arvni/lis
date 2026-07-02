<?php

namespace App\Domains\Billing\Services;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InvoiceComposer
{
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

        $buckets = $this->bucketize($acceptanceItems);
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
                    AcceptanceItem::whereIn('id', $bucket['acceptance_item_ids'])
                        ->update(['invoice_item_id' => $item->id]);
                    $keptIds[] = $item->id;
                    continue;
                }

                $payload = $this->payloadFor($bucket);
                if ($item) {
                    $item->fill($payload)->save();
                } else {
                    $item = $invoice->invoiceItems()->create($payload);
                }

                AcceptanceItem::whereIn('id', $bucket['acceptance_item_ids'])
                    ->update(['invoice_item_id' => $item->id]);

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

    private function isLocked(Invoice $invoice): bool
    {
        if ($invoice->statement_id) {
            return true;
        }
        return in_array($invoice->status, [
            InvoiceStatus::PAID,
            InvoiceStatus::CREDIT_PAID,
            InvoiceStatus::CANCELED,
        ], true);
    }

    /**
     * Group acceptance_items into invoice_item buckets.
     * Panels group by panel_id, mergeable tests group by test_id, everything else is its own bucket.
     * Buckets are scoped per acceptance so multi-acceptance invoices don't accidentally cross-merge.
     */
    private function bucketize(Collection $acceptanceItems): array
    {
        $buckets = [];

        foreach ($acceptanceItems as $ai) {
            $test = $ai->methodTest->test;
            $key = $this->keyForAcceptanceItem($ai, $test);

            if (! isset($buckets[$key])) {
                $kind = $this->kindFor($ai, $test);
                $buckets[$key] = [
                    'key'                  => $key,
                    'kind'                 => $kind,
                    'acceptance_id'        => $ai->acceptance_id,
                    'test_id'              => $test->id,
                    'panel_id'             => $kind === InvoiceItemKind::PANEL ? $ai->panel_id : null,
                    'title'                => $test->fullName ?: $test->name,
                    'code'                 => $test->code,
                    'unit_price'           => (float) $ai->price,
                    'qty'                  => 0,
                    'price_sum'            => 0.0,
                    'discount_sum'         => 0.0,
                    'customParameters'     => $this->normalizeCustomParameters($ai->customParameters),
                    'acceptance_item_ids'  => [],
                    'first_acceptance_item'=> $ai,
                ];
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
        $qty = match (true) {
            $kind === InvoiceItemKind::PANEL => 1,
            $kind === InvoiceItemKind::TEST  => $bucket['qty'],
            default                          => $bucket['qty'],
        };

        // For panels: one row represents the whole panel; price is the sum of children, qty=1.
        // For mergeable tests: qty=count, unit_price stays the per-item price, price is sum.
        // For singletons: qty=1, unit_price=item price.
        $unitPrice = $kind === InvoiceItemKind::PANEL
            ? $bucket['price_sum']
            : $bucket['unit_price'];

        $description = $this->descriptionFor($bucket['customParameters']);

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
            'customParameters' => $bucket['customParameters'] ?: null,
        ];
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
            return "panel:{$ai->acceptance_id}:{$ai->panel_id}";
        }
        if (! empty($test->can_merge)) {
            return "test:{$ai->acceptance_id}:{$test->id}";
        }
        return "single:{$ai->id}";
    }

    private function keyFor(InvoiceItem $item): string
    {
        if ($item->kind === InvoiceItemKind::PANEL) {
            return "panel:{$item->acceptance_id}:{$item->panel_id}";
        }
        if ($item->kind === InvoiceItemKind::TEST && $item->test && $item->test->can_merge) {
            return "test:{$item->acceptance_id}:{$item->test_id}";
        }
        $aiId = $item->acceptanceItems->first()?->id;
        return $aiId ? "single:{$aiId}" : "item:{$item->id}";
    }

    private function descriptionFor(?array $customParameters): string
    {
        $bits = [];
        $priceParams = $customParameters['price'] ?? [];
        if (! is_array($priceParams)) {
            return '';
        }
        foreach ($priceParams as $key => $value) {
            $label = ucwords(trim(preg_replace('/(?<!^)[A-Z]/', ' $0', $key)));
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
