<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use RuntimeException;

class ConfirmTransferReceiptController extends Controller
{
    public function __construct(private StockTransactionService $transactionService) {}

    public function __invoke(Request $request, StockTransaction $transaction): RedirectResponse
    {
        $this->authorize('viewAny', StockTransaction::class);

        try {
            $confirmed = $this->transactionService->confirmTransferReceipt($transaction, $request->user()->id);
        } catch (RuntimeException $e) {
            abort(400, $e->getMessage());
        }

        if (!$confirmed) {
            return back()->with(['success' => false, 'status' => 'Receipt already confirmed.']);
        }

        return back()->with(['success' => true, 'status' => 'Transfer receipt confirmed. Lots are now active in the destination store.']);
    }
}
