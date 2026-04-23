<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\LotStatus;
use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\StockTransaction;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConfirmTransferReceiptController extends Controller
{
    public function __invoke(Request $request, StockTransaction $transaction): RedirectResponse
    {
        $this->authorize('viewAny', StockTransaction::class);

        if ($transaction->transaction_type !== TransactionType::TRANSFER) {
            abort(400, 'Only TRANSFER transactions can be confirmed.');
        }
        if ($transaction->status !== TransactionStatus::APPROVED) {
            abort(400, 'Transaction must be APPROVED before confirming receipt.');
        }
        if ($transaction->transfer_received_at) {
            return back()->with(['success' => false, 'status' => 'Receipt already confirmed.']);
        }

        DB::transaction(function () use ($transaction, $request) {
            // Activate the quarantined lots in the destination store
            $lotNumbers = $transaction->lines->pluck('lot_number')->filter()->unique();

            StockLot::where('store_id', $transaction->destination_store_id)
                ->where('status', LotStatus::QUARANTINE->value)
                ->whereIn('lot_number', $lotNumbers)
                ->update(['status' => LotStatus::ACTIVE->value]);

            $transaction->update([
                'transfer_received_at'         => now(),
                'transfer_received_by_user_id' => $request->user()->id,
            ]);
        });

        return back()->with(['success' => true, 'status' => 'Transfer receipt confirmed. Lots are now active in the destination store.']);
    }
}
