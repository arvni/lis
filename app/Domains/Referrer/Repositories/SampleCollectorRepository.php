<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Referrer\Models\SampleCollector;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Pagination\LengthAwarePaginator;

class SampleCollectorRepository
{
    public function listSampleCollector(array $queryData): LengthAwarePaginator
    {
        $query = SampleCollector::query()->withCount(['collectRequests']);

        if (isset($queryData["filters"])) {
            $this->applyFilters($query, $queryData["filters"]);
        }

        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'desc');
        return $query->paginate($queryData["pageSize"]);
    }

    public function createSampleCollector(array $data): SampleCollector
    {
        $sampleCollector = SampleCollector::create($data);
        UserActivityService::createUserActivity($sampleCollector, ActivityType::CREATE);
        return $sampleCollector;
    }

    public function updateSampleCollector(SampleCollector $sampleCollector, array $data): SampleCollector
    {
        $sampleCollector->fill($data);
        if ($sampleCollector->isDirty()) {
            $sampleCollector->save();
            UserActivityService::createUserActivity($sampleCollector, ActivityType::UPDATE);
        }
        return $sampleCollector;
    }

    public function deleteSampleCollector(SampleCollector $sampleCollector): void
    {
        $sampleCollector->delete();
        UserActivityService::createUserActivity($sampleCollector, ActivityType::DELETE);
    }

    public function findSampleCollectorById($id): ?SampleCollector
    {
        return SampleCollector::find($id);
    }

    public function findSampleCollectorByEmail($email): ?SampleCollector
    {
        return SampleCollector::where("email", $email)->first();
    }

    public function applyFilters($query, array $filters)
    {
        if (isset($filters["search"])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }
    }
}
