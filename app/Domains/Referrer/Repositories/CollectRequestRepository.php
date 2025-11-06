<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Referrer\Models\CollectRequest;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Pagination\LengthAwarePaginator;

class CollectRequestRepository
{
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
        UserActivityService::createUserActivity($collectRequest, ActivityType::CREATE);
        return $collectRequest;
    }

    public function updateCollectRequest(CollectRequest $collectRequest, array $data): CollectRequest
    {
        $collectRequest->fill($data);
        if ($collectRequest->isDirty()) {
            $collectRequest->save();
            UserActivityService::createUserActivity($collectRequest, ActivityType::UPDATE);
        }
        return $collectRequest;
    }

    public function deleteCollectRequest(CollectRequest $collectRequest): void
    {
        $collectRequest->delete();
        UserActivityService::createUserActivity($collectRequest, ActivityType::DELETE);
    }

    public function findCollectRequestById($id): ?CollectRequest
    {
        return CollectRequest::with(['sampleCollector', 'referrer'])->find($id);
    }

    public function applyFilters($query, array $filters)
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
