<?php

declare(strict_types=1);

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class DiscountCardBatchRepository
{
    use LogsUserActivity;

    public function listBatches(array $queryData): LengthAwarePaginator
    {
        $query = DiscountCardBatch::query()
            ->with(['partner:id,name', 'issuer:id,name'])
            ->withCount('cards');

        if (isset($queryData['filters'])) {
            $this->applyFilters($query, $queryData['filters']);
        }

        $query->orderBy(
            $queryData['sort']['field'] ?? 'id',
            $queryData['sort']['sort'] ?? 'desc'
        );

        return $query->paginate($queryData['pageSize'] ?? 10);
    }

    public function createBatch(array $data): DiscountCardBatch
    {
        $batch = DiscountCardBatch::query()->make($data);
        $batch->save();
        $this->logCreated($batch);

        return $batch;
    }

    public function seriesExists(string $series): bool
    {
        return DiscountCardBatch::query()->where('series', $series)->exists();
    }

    public function markPrinted(DiscountCardBatch $batch): void
    {
        $batch->forceFill(['printed_at' => now()])->save();
    }

    /**
     * @param  Builder<DiscountCardBatch>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters['search'])) {
            $query->search(['series', 'prefix'], $filters['search']);
        }
        if (isset($filters['discount_partner_id'])) {
            $query->where('discount_partner_id', $filters['discount_partner_id']);
        }
    }
}
