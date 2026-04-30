<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Models\StockTransaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockTransactionRepository
{
    use LogsUserActivity;

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
