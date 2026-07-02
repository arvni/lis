<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Referrer\Models\CollectRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class CollectRequestRepository
{
    use LogsUserActivity;

    /**
     * Barcoded collect requests for barcode lookup — newest first, optionally
     * filtered by referrer and a barcode search term.
     */
    public function listBarcodedForLookup(?int $referrerId, ?string $search, int $perPage = 20): LengthAwarePaginator
    {
        return CollectRequest::query()
            ->whereNotNull('barcode')
            ->when($referrerId, fn (Builder $q) => $q->where('referrer_id', $referrerId))
            ->when($search, fn (Builder $q) => $q->where('barcode', 'like', "%{$search}%"))
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function listCollectRequest(array $queryData): LengthAwarePaginator
    {
        $query = CollectRequest::query()
            ->with(['sampleCollector', 'referrer'])
            ->withCount(['referrerOrders']);

        if (isset($queryData["filters"])) {
            $this->applyFilters($query, $queryData["filters"]);
        }

        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'desc');
        return $query->paginate($queryData["pageSize"]);
    }

    public function createCollectRequest(array $data): CollectRequest
    {
        $collectRequest = CollectRequest::create($data);
        $this->logCreated($collectRequest);
        return $collectRequest;
    }

    public function updateCollectRequest(CollectRequest $collectRequest, array $data): CollectRequest
    {
        $collectRequest->fill($data);
        if ($collectRequest->isDirty()) {
            $collectRequest->save();
            $this->logUpdated($collectRequest);
        }
        return $collectRequest;
    }

    public function deleteCollectRequest(CollectRequest $collectRequest): void
    {
        $collectRequest->delete();
        $this->logDeleted($collectRequest);
    }

    public function findCollectRequestById(int|string $id): ?CollectRequest
    {
        return CollectRequest::with(['sampleCollector', 'referrer'])->find($id);
    }

    public function listCollectRequestsForCalendar(string $month): \Illuminate\Support\Collection
    {
        $start = \Carbon\Carbon::parse($month . '-01')->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        return CollectRequest::query()
            ->with(['sampleCollector:id,name', 'referrer:id,fullName'])
            ->whereBetween('preferred_date', [$start, $end])
            ->orderBy('preferred_date')
            ->get(['id', 'preferred_date', 'note', 'status', 'logistic_information', 'sample_collector_id', 'referrer_id']);
    }

    public function applyFilters($query, array $filters): void
    {
        if (isset($filters["search"])) {
            $query->whereHas('sampleCollector', function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('email', 'like', "%{$filters['search']}%");
            })
            ->orWhereHas('referrer', function ($q) use ($filters) {
                $q->search($filters['search']);
            });
        }

        if (isset($filters["sample_collector_id"])) {
            $query->where('sample_collector_id', $filters["sample_collector_id"]);
        }

        if (isset($filters["referrer_id"])) {
            $query->where('referrer_id', $filters["referrer_id"]);
        }

        if (isset($filters["status"])) {
            $query->where('status', $filters["status"]);
        }
    }
}
