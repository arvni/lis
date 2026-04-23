<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class CancelTransactionController extends Controller
{
    public function __construct(private StockTransactionService $transactionService) {}

    public function __invoke(StockTransaction $transaction): RedirectResponse
    {
        $this->authorize('cancel', StockTransaction::class);
        $tx = $this->transactionService->cancel($transaction);
        return back()->with(['success' => true, 'status' => "Transaction {$tx->reference_number} cancelled."]);
    }
}
