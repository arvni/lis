<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReturnToRequesterController extends Controller
{
    public function __construct(private StockTransactionService $transactionService) {}

    public function __invoke(StockTransaction $transaction, Request $request): RedirectResponse
    {
        $this->authorize('approve', StockTransaction::class);

        $notes = $request->input('notes');
        $this->transactionService->returnToRequester($transaction, $notes);

        return back()->with([
            'success' => true,
            'status'  => "Transaction returned to requester" . ($notes ? ": {$notes}" : "."),
        ]);
    }
}
