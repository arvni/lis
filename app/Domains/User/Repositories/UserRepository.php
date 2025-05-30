<?php

namespace App\Domains\User\Repositories;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;

class UserRepository
{
    public function all(array $queryData = [])
    {
        $query = User::query()->with('roles');
        if (isset($queryData["filters"]))
            $this->apalyFilters($query, $queryData["filters"]);

        $query->orderBy($filters['sort']['field'] ?? 'id', $filters['sort']['sort'] ?? 'asc');

        return $query->paginate($filters["pageSize"] ?? 10);
    }

    public function find(int $id): ?User
    {
        return User::with('roles')->find($id);
    }

    public function create(array $data): User
    {

        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user;
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    public function apalyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name","username","email","mobile","title"],$filters["search"]);

        if (!empty($filters['role'])) {
            $query->whereHas('roles', fn($q) => $q->where('id', $filters['role']['id']));
        }
    }
}
