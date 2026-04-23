<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use RuntimeException;

class ApproveTransactionController extends Controller
{
    public function __construct(private StockTransactionService $transactionService) {}

    public function __invoke(StockTransaction $transaction): RedirectResponse
    {
        $this->authorize('approve', StockTransaction::class);
        try {
            $tx = $this->transactionService->approve($transaction);
            return back()->with(['success' => true, 'status' => "Transaction {$tx->reference_number} approved and stock updated."]);
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }
    }
}
