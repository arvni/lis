<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\Method;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MethodRepository
{

    public function listMethods(array $queryData): LengthAwarePaginator
    {
        $query = Method::withCount(["acceptanceItems"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatMethod(array $methodData): Method
    {
        $method= Method::query()->create($methodData);
        UserActivityService::createUserActivity($method,ActivityType::CREATE);
        return $method;
    }

    public function updateMethod(Method $method, array $methodData): Method
    {
        $method->fill($methodData);
        if ($method->isDirty()) {
            $method->save();
            UserActivityService::createUserActivity($method,ActivityType::UPDATE);
        }
        return $method;
    }

    public function deleteMethod(Method $method): void
    {
        $method->delete();
        UserActivityService::createUserActivity($method,ActivityType::DELETE);
    }

    public function findMethodById($id):?Method
    {
        return Method::find($id);
    }

    public function findMethodByMethodTestId($id):?Method
    {
        return Method::whereHas("methodTests", fn($q) => $q->where("method_tests.id", $id))->first();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search($filters["search"]);
    }


}
