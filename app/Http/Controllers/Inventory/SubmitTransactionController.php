<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class SubmitTransactionController extends Controller
{
    public function __construct(private StockTransactionService $transactionService) {}

    public function __invoke(StockTransaction $transaction): RedirectResponse
    {
        $this->authorize('create', StockTransaction::class);
        $tx = $this->transactionService->submitForApproval($transaction);
        return back()->with(['success' => true, 'status' => "Transaction {$tx->reference_number} submitted for approval."]);
    }
}
