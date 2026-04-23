<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Models\StockTransaction;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use RuntimeException;

class RevertTransactionController extends Controller
{
    public function __invoke(StockTransaction $transaction): RedirectResponse
    {
        $this->authorize('create', StockTransaction::class);

        if (!$transaction->isPendingApproval())
            throw new RuntimeException("Only PENDING_APPROVAL transactions can be revised.");

        $transaction->update(['status' => TransactionStatus::DRAFT->value]);

        return redirect()
            ->route('inventory.transactions.edit', $transaction->id)
            ->with(['success' => true, 'status' => "Transaction reverted to draft — you can now edit it."]);
    }
}
