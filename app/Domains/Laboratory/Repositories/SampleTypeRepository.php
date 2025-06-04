<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\SampleType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SampleTypeRepository
{
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
        return $sampleType;
    }

    public function updateSampleType(SampleType $sampleType, array $sampleTypeData): SampleType
    {
        $sampleType->fill($sampleTypeData);
        if ($sampleType->isDirty())
            $sampleType->save();
        return $sampleType;
    }

    public function deleteSampleType(SampleType $sampleType): void
    {
        $sampleType->delete();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

    public function getSampleTypeById($id): ?SampleType
    {
        return SampleType::query()->findOrFail($id);
    }

}
