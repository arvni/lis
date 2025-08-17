<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\SampleType;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
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
        UserActivityService::createUserActivity($sampleType,ActivityType::CREATE);
        return $sampleType;
    }

    public function updateSampleType(SampleType $sampleType, array $sampleTypeData): SampleType
    {
        $sampleType->fill($sampleTypeData);
        if ($sampleType->isDirty()) {
            $sampleType->save();
            UserActivityService::createUserActivity($sampleType,ActivityType::UPDATE);
        }
        return $sampleType;
    }

    public function deleteSampleType(SampleType $sampleType): void
    {
        $sampleType->delete();
        UserActivityService::createUserActivity($sampleType,ActivityType::DELETE);
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
