<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\Test;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TestRepository
{

    public function listTests(array $queryData): LengthAwarePaginator
    {
        $query = Test::withCount("acceptanceItems")
            ->withAggregate("testGroup", "name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        if (isset($queryData["with"])) {
            $query->with($queryData['with']);
        }
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatTest(array $testData): Test
    {
        return Test::query()->create($testData);
    }

    public function updateTest(Test $test, array $testData): Test
    {
        $test->fill($testData);
        if ($test->isDirty())
            $test->save();
        return $test;
    }

    public function deleteTest(Test $test): void
    {
        $test->delete();
    }

    public function findTestById($id): ?Test
    {
        return Test::find($id);
    }

    public function findTestByMethodTestId($id): ?Test
    {
        return Test::whereHas("methodTests", fn($q) => $q->where("method_tests.id", $id))->first();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search($filters["search"]);
        if (isset($filters["test_group"]["id"]))
            $query->whereHas("testGroup", fn($q) => $q->where("test_groups.id", $filters["test_group"]["id"]));
        if (isset($filters["status"]))
            $query->where("status", $filters["status"]);
        if (isset($filters["type"]))
            $query->whereIn("type", explode(",", $filters["type"]));
        if (isset($filters["active"])) {
            $query->active();
        }
    }

}
