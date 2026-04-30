<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\SampleType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SampleTypeRepository
{
    use LogsUserActivity;

    public function listSampleTypes(array $queryData): LengthAwarePaginator
    {
        $query = SampleType::query()
            ->withCount("samples");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatSampleType(array $sampleTypeData): SampleType
    {
        $sampleType = SampleType::query()->make($sampleTypeData);
        $sampleType->save();
        $this->logCreated($sampleType);
        return $sampleType;
    }

    public function updateSampleType(SampleType $sampleType, array $sampleTypeData): SampleType
    {
        $sampleType->fill($sampleTypeData);
        if ($sampleType->isDirty()) {
            $sampleType->save();
            $this->logUpdated($sampleType);
        }
        return $sampleType;
    }

    public function deleteSampleType(SampleType $sampleType): void
    {
        $sampleType->delete();
        $this->logDeleted($sampleType);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["orderable"]))
            $query->where("orderable", filter_var($filters["orderable"], FILTER_VALIDATE_BOOLEAN));
    }

    public function getSampleTypeById($id): ?SampleType
    {
        return SampleType::query()->findOrFail($id);
    }

}
