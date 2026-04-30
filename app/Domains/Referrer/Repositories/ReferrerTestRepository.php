<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Referrer\DTOs\ReferrerTestDTO;
use App\Domains\Referrer\Models\ReferrerTest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReferrerTestRepository
{
    use LogsUserActivity;

    public function index(array $queryData = []): LengthAwarePaginator
    {
        $query = ReferrerTest::query()->with(["test"]);

        // Apply filters
        if (!empty($queryData['filters'])) {
            $this->applyFilter($queryData['filters'], $query);
        }
        // Apply sorting
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');

        // Apply pagination
        return $query->paginate($queryData["pageSize"]);
    }

    public function findById(int $id): ?ReferrerTest
    {
        return ReferrerTest::find($id);
    }

    public function findByMethodIdAdnReferrerId(int $methodId, int $referrerId): ?ReferrerTest
    {
        return ReferrerTest::where('method_id', $methodId)->where('referrer_id', $referrerId)->first();
    }

    public function store($data): ReferrerTest
    {
        $referrerTest = ReferrerTest::create($data);
        $this->logCreated($referrerTest);
        return $referrerTest;
    }

    public function update(ReferrerTest $referrerTest, $data)
    {
        $referrerTest->update($data);
        $this->logDeleted($referrerTest);
        return $referrerTest;
    }

    public function delete(ReferrerTest $referrerTest): bool
    {
        $this->logDeleted($referrerTest);
        return $referrerTest->delete();
    }

    private function applyFilter(array $filters, $query)
    {
        if (isset($filters['search']))
            $query->whereHas('test', function ($q) use ($filters) {
                $q->search($filters['search']);
            });
        if (isset($filters['referrer_id']))
            $query->where('referrer_id', $filters['referrer_id']);
        if (isset($filters['referrer']))
            $query->where('referrer_id', $filters['referrer']["id"]);
        if (isset($filters['test_id']))
            $query->where('test_id', $filters['test_id']);
    }
}
