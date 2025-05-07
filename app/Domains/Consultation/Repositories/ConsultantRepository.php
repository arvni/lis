<?php

namespace App\Domains\Consultation\Repositories;

use App\Domains\Consultation\Models\Consultant;

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

        return Consultant::create($data);
    }

    public function update(Consultant $user, array $data): Consultant
    {
        $user->update($data);
        return $user;
    }

    public function delete(Consultant $user): void
    {
        $user->delete();
    }

    public function apalyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name", "title"], $filters["search"]);
        if (isset($filters["active"]))
            $query->where("active", $filters["active"]);
    }
}
