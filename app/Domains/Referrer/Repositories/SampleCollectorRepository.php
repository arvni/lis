<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Referrer\Models\SampleCollector;
use Illuminate\Pagination\LengthAwarePaginator;

class SampleCollectorRepository
{
    use LogsUserActivity;

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
        $this->logCreated($sampleCollector);
        return $sampleCollector;
    }

    public function updateSampleCollector(SampleCollector $sampleCollector, array $data): SampleCollector
    {
        $sampleCollector->fill($data);
        if ($sampleCollector->isDirty()) {
            $sampleCollector->save();
            $this->logUpdated($sampleCollector);
        }
        return $sampleCollector;
    }

    public function deleteSampleCollector(SampleCollector $sampleCollector): void
    {
        $sampleCollector->delete();
        $this->logDeleted($sampleCollector);
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
