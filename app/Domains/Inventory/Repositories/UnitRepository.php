<?php

namespace App\Domains\Inventory\Repositories;

use App\Domains\Inventory\Models\Unit;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UnitRepository
{
    public function listUnits(array $queryData): LengthAwarePaginator
    {
        $query = Unit::withCount('itemConversions');
        if (isset($queryData['filters']['search']))
            $query->search($queryData['filters']['search']);
        if (isset($queryData['sort']))
            $query->orderBy($queryData['sort']['field'] ?? 'name', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData['pageSize'] ?? 15);
    }

    public function createUnit(array $data): Unit
    {
        $unit = Unit::query()->create($data);
        UserActivityService::createUserActivity($unit, ActivityType::CREATE);
        return $unit;
    }

    public function updateUnit(Unit $unit, array $data): Unit
    {
        $unit->fill($data);
        if ($unit->isDirty()) {
            $unit->save();
            UserActivityService::createUserActivity($unit, ActivityType::UPDATE);
        }
        return $unit;
    }

    public function deleteUnit(Unit $unit): void
    {
        $unit->delete();
        UserActivityService::createUserActivity($unit, ActivityType::DELETE);
    }
}
