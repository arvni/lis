<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Repositories\InvoiceRepository;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InvoiceItemController extends Controller
{
    public function __construct(
        private readonly InvoiceComposer $composer,
        private readonly InvoiceRepository $invoiceRepository,
    ) {
    }

    /**
     * Unlock an invoice_item so the composer takes ownership again.
     * Only meaningful for test/panel rows derived from acceptance_items —
     * manual rows have nothing to fall back to and would be swept on the next recompose.
     */
    public function unlock(Request $request, Invoice $invoice, InvoiceItem $item): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $invoice);

        if ($item->invoice_id !== $invoice->id) {
            abort(404);
        }

        if (! in_array($item->kind, [InvoiceItemKind::TEST, InvoiceItemKind::PANEL], true)) {
            throw ValidationException::withMessages([
                'item' => 'Only test or panel rows can be reset to auto.',
            ]);
        }

        $item->update(['locked_at' => null]);
        $this->composer->recompose($invoice);

        return redirect()->back()->with([
            'success' => true,
            'status'  => 'Item reset to auto.',
        ]);
    }

    /**
     * Rebuild the invoice's test/panel lines from its current acceptance_items.
     * Clears user-deletion tombstones (so removed lines come back) and resets derived
     * test/panel rows to auto. Manual fee / adjustment rows are left untouched.
     *
     * This is an explicit, user-triggered override: it forces a recompose even on settled
     * or statemented invoices, so it can change the invoice's (and its statement's) totals.
     */
    public function rebuild(Request $request, Invoice $invoice): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $invoice);

        $this->invoiceRepository->resetItemsForRebuild($invoice);

        // force: bypass the composer's paid/statemented lock so settled invoices still rebuild.
        $this->composer->recompose($invoice, force: true);

        return redirect()->back()->with([
            'success' => true,
            'status'  => 'Invoice items rebuilt from acceptance items.',
        ]);
    }
}
