<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection as SupportCollection;

class StockTransactionRepository
{
    use LogsUserActivity;

    /**
     * Approved transaction lines that reference a lot (by item + lot number),
     * oldest first, with transaction/store/unit/location eager-loaded.
     *
     * @return EloquentCollection<int, StockTransactionLine>
     */
    public function approvedLinesForLot(int $itemId, string $lotNumber): EloquentCollection
    {
        return StockTransactionLine::with(['transaction.store', 'unit', 'location'])
            ->where('item_id', $itemId)
            ->where('lot_number', $lotNumber)
            ->whereHas('transaction', fn (Builder $q) => $q->where('status', 'APPROVED'))
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Distinct, non-empty brand names recorded for an item on transaction lines,
     * optionally narrowed by a search term — used for brand typeahead.
     */
    public function brandSuggestionsForItem(int $itemId, ?string $search = null, int $limit = 20): SupportCollection
    {
        return StockTransactionLine::where('item_id', $itemId)
            ->whereNotNull('brand')
            ->where('brand', '!=', '')
            ->when($search, fn (Builder $q) => $q->where('brand', 'like', "%{$search}%"))
            ->distinct()
            ->orderBy('brand')
            ->limit($limit)
            ->pluck('brand');
    }

    /**
     * Most recent transaction line carrying a scanned barcode — used as a
     * history fallback for item identification when no active lots remain.
     * Item (with default unit + conversions) and the line's unit are loaded.
     */
    public function latestLineByBarcode(string $barcode): ?StockTransactionLine
    {
        return StockTransactionLine::with(['item.defaultUnit', 'item.unitConversions.unit', 'unit'])
            ->where('barcode', $barcode)
            ->latest()
            ->first();
    }

    /**
     * A transaction's lines/items/units/supplier hydrated for the "repeat from"
     * create flow. Returns null when the source transaction does not exist.
     */
    public function findForRepeat(int $transactionId): ?StockTransaction
    {
        return StockTransaction::with(['lines.item.defaultUnit', 'lines.unit', 'supplier'])
            ->find($transactionId);
    }

    public function listTransactions(array $queryData): LengthAwarePaginator
    {
        $query = StockTransaction::with(['store', 'supplier', 'requestedBy'])
            ->withCount('lines');
        if (isset($queryData['filters']['transaction_type']))
            $query->where('transaction_type', $queryData['filters']['transaction_type']);
        if (isset($queryData['filters']['status']))
            $query->where('status', $queryData['filters']['status']);
        if (isset($queryData['filters']['store_id']))
            $query->where('store_id', $queryData['filters']['store_id']);
        if (isset($queryData['filters']['date_from']))
            $query->whereDate('transaction_date', '>=', $queryData['filters']['date_from']);
        if (isset($queryData['filters']['date_to']))
            $query->whereDate('transaction_date', '<=', $queryData['filters']['date_to']);
        $query->orderBy('transaction_date', 'desc')->orderBy('id', 'desc');
        return $query->paginate($queryData['pageSize'] ?? 20);
    }

    public function createTransaction(array $data): StockTransaction
    {
        $lines = $data['lines'] ?? [];
        unset($data['lines']);
        $tx = StockTransaction::query()->create($data);
        foreach ($lines as $line)
            $tx->lines()->create($line);
        $this->logCreated($tx);
        return $tx->load('lines.item', 'lines.unit');
    }

    public function approve(StockTransaction $tx, int $approverId): StockTransaction
    {
        $tx->update([
            'status'              => TransactionStatus::APPROVED->value,
            'approved_by_user_id' => $approverId,
        ]);
        $this->logUpdated($tx);
        return $tx;
    }

    public function cancel(StockTransaction $tx): StockTransaction
    {
        $tx->update(['status' => TransactionStatus::CANCELLED->value]);
        $this->logUpdated($tx);
        return $tx;
    }
}
