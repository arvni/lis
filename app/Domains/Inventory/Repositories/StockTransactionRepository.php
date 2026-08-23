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
        $this->applyTransactionFilters($query, $queryData['filters'] ?? []);
        $query->orderBy('transaction_date', 'desc')->orderBy('id', 'desc');
        return $query->paginate($queryData['pageSize'] ?? 20);
    }

    /**
     * All transactions matching the list filters, with lines eager-loaded for
     * export. Mirrors listTransactions filtering without pagination.
     *
     * @param array<string, mixed> $queryData
     * @return EloquentCollection<int, StockTransaction>
     */
    public function listAllTransactions(array $queryData): EloquentCollection
    {
        $query = StockTransaction::with([
            'store', 'supplier', 'requestedBy',
            'lines.item', 'lines.unit', 'lines.location',
        ]);
        $this->applyTransactionFilters($query, $queryData['filters'] ?? []);
        $query->orderBy('transaction_date', 'desc')->orderBy('id', 'desc');
        return $query->get();
    }

    /**
     * @param Builder<StockTransaction> $query
     * @param array<string, mixed> $filters
     */
    private function applyTransactionFilters(Builder $query, array $filters): void
    {
        if (isset($filters['search']) && $filters['search'] !== '')
            $this->applySearch($query, (string) $filters['search']);
        if (isset($filters['transaction_type']))
            $query->where('transaction_type', $filters['transaction_type']);
        if (isset($filters['status']))
            $query->where('status', $filters['status']);
        if (isset($filters['store_id']))
            $query->where('store_id', $filters['store_id']);
        if (isset($filters['date_from']))
            $query->whereDate('transaction_date', '>=', $filters['date_from']);
        if (isset($filters['date_to']))
            $query->whereDate('transaction_date', '<=', $filters['date_to']);
    }

    /**
     * Free-text search across the transaction reference and the identifiers
     * carried on its lines — item code/name, lot number and catalog number —
     * so a container in hand can be traced back to the movement that booked it.
     *
     * @param Builder<StockTransaction> $query
     */
    private function applySearch(Builder $query, string $search): void
    {
        $term = '%'.$search.'%';

        $query->where(function (Builder $q) use ($term) {
            $q->where('reference_number', 'like', $term)
                ->orWhereHas('lines', fn (Builder $q2) => $q2->where(function (Builder $q3) use ($term) {
                    $q3->where('lot_number', 'like', $term)
                        ->orWhere('cat_no', 'like', $term);
                }))
                ->orWhereHas('lines.item', fn (Builder $q2) => $q2->where(function (Builder $q3) use ($term) {
                    $q3->where('item_code', 'like', $term)
                        ->orWhere('name', 'like', $term);
                }));
        });
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
