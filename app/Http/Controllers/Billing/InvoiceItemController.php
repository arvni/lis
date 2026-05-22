<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InvoiceItemController extends Controller
{
    public function __construct(private readonly InvoiceComposer $composer)
    {
    }

    /**
     * Unlock an invoice_item so the composer takes ownership again.
     * Only meaningful for test/panel rows derived from acceptance_items —
     * manual rows have nothing to fall back to and would be swept on the next recompose.
     */
    public function unlock(Request $request, Invoice $invoice, InvoiceItem $item)
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
}
