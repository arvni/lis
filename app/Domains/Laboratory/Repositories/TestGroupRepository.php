<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\TestGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TestGroupRepository
{
    use LogsUserActivity;


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
        $this->logCreated($testGroup);
        return $testGroup;
    }

    public function updateTestGroup(TestGroup $testGroup, array $testGroupData): TestGroup
    {
        $testGroup->fill($testGroupData);
        if ($testGroup->isDirty()) {
            $testGroup->save();
            $this->logUpdated($testGroup);
        }
        return $testGroup;
    }

    public function deleteTestGroup(TestGroup $testGroup): void
    {
        $testGroup->delete();
        $this->logDeleted($testGroup);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

}
