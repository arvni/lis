<?php

namespace App\Domains\Billing\Services;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class InvoiceItemSyncService
{
    /**
     * Sync the user-submitted invoice_items payload onto the invoice.
     *
     * - Rows with id + _destroy=true → soft-delete and unlink their acceptance_items.
     * - Rows with id → update fields (locks the row so the composer leaves it alone).
     * - Rows without id → create as manual_fee (or whatever kind was sent) and lock.
     *
     * Returns a summary array {created, updated, deleted}.
     */
    public function sync(Invoice $invoice, array $items): array
    {
        return DB::transaction(function () use ($invoice, $items) {
            $created = 0;
            $updated = 0;
            $deleted = 0;

            foreach ($items as $payload) {
                $id = $payload['id'] ?? null;
                $destroy = ! empty($payload['_destroy']);

                if ($id && $destroy) {
                    if ($this->destroy($invoice, (int) $id)) {
                        $deleted++;
                    }
                    continue;
                }

                if ($id) {
                    if ($this->update($invoice, (int) $id, $payload)) {
                        $updated++;
                    }
                    continue;
                }

                $this->create($invoice, $payload);
                $created++;
            }

            return compact('created', 'updated', 'deleted');
        });
    }

    private function destroy(Invoice $invoice, int $id): bool
    {
        $item = $invoice->invoiceItems()->find($id);
        if (! $item) {
            return false;
        }
        AcceptanceItem::where('invoice_item_id', $item->id)
            ->update(['invoice_item_id' => null]);
        $item->delete();
        return true;
    }

    private function update(Invoice $invoice, int $id, array $payload): bool
    {
        $item = $invoice->invoiceItems()->find($id);
        if (! $item) {
            return false;
        }
        $item->fill($this->fillableFrom($payload, $item));
        $item->locked_at = $item->locked_at ?? now();
        $this->recalculatePrice($item);
        $item->save();
        return true;
    }

    private function create(Invoice $invoice, array $payload): InvoiceItem
    {
        $attrs = $this->fillableFrom($payload, null);
        $attrs['kind'] = $attrs['kind'] ?? InvoiceItemKind::MANUAL_FEE->value;
        $attrs['locked_at'] = now();
        $item = $invoice->invoiceItems()->create($attrs);
        $this->recalculatePrice($item);
        $item->save();
        return $item;
    }

    private function fillableFrom(array $payload, ?InvoiceItem $existing): array
    {
        $allowed = [
            'kind',
            'title',
            'code',
            'description',
            'unit_price',
            'qty',
            'discount',
            'customParameters',
        ];

        // Identity fields (test_id / panel_id / acceptance_id) are only writable on create,
        // and only for manual items. Auto-generated rows keep their existing identity.
        if (! $existing) {
            $allowed = array_merge($allowed, ['test_id', 'acceptance_id', 'panel_id']);
        }

        $attrs = Arr::only($payload, $allowed);

        if (isset($attrs['kind']) && $attrs['kind'] instanceof InvoiceItemKind) {
            $attrs['kind'] = $attrs['kind']->value;
        }

        return $attrs;
    }

    private function recalculatePrice(InvoiceItem $item): void
    {
        $item->price = (float) $item->unit_price * max(1, (int) $item->qty);
    }
}
