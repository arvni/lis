<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\TestGroup;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TestGroupRepository
{

    public function listTestGroups(array $queryData): LengthAwarePaginator
    {
        $query = TestGroup::withCount(["tests"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatTestGroup(array $testGroupData): TestGroup
    {
        $testGroup = TestGroup::query()->create($testGroupData);
        UserActivityService::createUserActivity($testGroup, ActivityType::CREATE);
        return $testGroup;
    }

    public function updateTestGroup(TestGroup $testGroup, array $testGroupData): TestGroup
    {
        $testGroup->fill($testGroupData);
        if ($testGroup->isDirty()) {
            $testGroup->save();
            UserActivityService::createUserActivity($testGroup,ActivityType::UPDATE);
        }
        return $testGroup;
    }

    public function deleteTestGroup(TestGroup $testGroup): void
    {
        $testGroup->delete();
        UserActivityService::createUserActivity($testGroup,ActivityType::DELETE);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

}
