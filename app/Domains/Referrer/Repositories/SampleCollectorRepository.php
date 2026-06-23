<?php

namespace App\Domains\Referrer\Repositories;

use Illuminate\Database\Eloquent\Builder;
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

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, SampleCollector>
     */
    public function all(): \Illuminate\Database\Eloquent\Collection
    {
        return SampleCollector::all();
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

    public function findSampleCollectorById(int|string $id): ?SampleCollector
    {
        return SampleCollector::find($id);
    }

    public function findSampleCollectorByEmail(string $email): ?SampleCollector
    {
        return SampleCollector::where("email", $email)->first();
    }

    /**
     * @param  Builder<SampleCollector>  $query
     */
    public function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }
    }
}
