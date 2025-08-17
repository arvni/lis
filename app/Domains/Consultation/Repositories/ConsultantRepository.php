<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Consultation\Models\Consultant;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;

class ConsultantRepository
{
    public function all(array $queryData = [])
    {
        $query = Consultant::query()->with('user');
        if (isset($queryData["filters"]))
            $this->apalyFilters($query, $queryData["filters"]);

        $query->orderBy($filters['sort']['field'] ?? 'id', $filters['sort']['sort'] ?? 'asc');

        return $query->paginate($filters["pageSize"] ?? 10);
    }

    public function find(int $id): ?Consultant
    {
        return Consultant::with('user')->find($id);
    }

    public function create(array $data): Consultant
    {

        $consultant= Consultant::create($data);
        UserActivityService::createUserActivity($consultant,ActivityType::CREATE);
        return $consultant;
    }

    public function update(Consultant $consultant, array $data): Consultant
    {
        $consultant->update($data);
        UserActivityService::createUserActivity($consultant,ActivityType::UPDATE);
        return $consultant;
    }

    public function delete(Consultant $consultant): void
    {
        $consultant->delete();
        UserActivityService::createUserActivity($consultant,ActivityType::DELETE);
    }

    public function apalyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name", "title"], $filters["search"]);
        if (isset($filters["active"]))
            $query->where("active", $filters["active"]);
    }
}
