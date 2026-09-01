<?php

declare(strict_types=1);

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\DTOs\StockReconciliationLineDTO;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Services\StockReconciliationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RecalculateStockController extends Controller
{
    public function __construct(private StockReconciliationService $reconciliation) {}

    public function __invoke(Request $request, Item $item): RedirectResponse
    {
        // This rewrites stock levels, so it takes the same clearance as
        // approving a transaction.
        $this->authorize('approve', StockTransaction::class);

        $results = $this->reconciliation->recalculate(
            $item,
            (int) $request->user()->id,
            $request->integer('store_id') ?: null,
        );

        $corrected = array_values(array_filter(
            $results,
            fn (StockReconciliationLineDTO $line) => $line->corrected
        ));

        if ($corrected === []) {
            return back()->with([
                'success' => true,
                'status' => 'Stock recalculated — the lots already matched the transaction ledger.',
            ]);
        }

        $changes = implode(', ', array_map(
            fn (StockReconciliationLineDTO $line) => sprintf(
                '%s %s → %s',
                $line->store_name,
                rtrim(rtrim(number_format($line->previous, 4, '.', ''), '0'), '.'),
                rtrim(rtrim(number_format($line->expected, 4, '.', ''), '0'), '.'),
            ),
            $corrected
        ));

        return back()->with([
            'success' => true,
            'status' => 'Stock recalculated from the transaction ledger — '.$changes.'.',
        ]);
    }
}
