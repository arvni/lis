<?php

namespace App\Domains\User\Repositories;

use App\Domains\User\Models\Role;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;

class RoleRepository
{
    public function list(array $queryData)
    {
        $query = Role::query()->withCount('users');
       if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);

        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function create(array $data): Role
    {
        $role = Role::create($data);
        $role->syncPermissions($data['permissions'] ?? []);
        return $role;
    }

    public function edit(Role $role, array $data): Role
    {
        $role->update($data);
        $role->syncPermissions($data['permissions'] ?? []);
        return $role;
    }

    public function delete(Role $role): void
    {
        $role->delete();
    }

    public function getAdminRole():?Role
    {
        return Role::findByName("Admin");
    }

    public function getPermissions(): Collection
    {
        return Permission::query()->orderBy('name')->get(['name', 'id']);
    }

    public function applyFilters($query, array $filters)
    {
        if (!empty($filters['search']))
            $query->search(['name'], $filters['search']);


        if (!empty($filters['permissions']))
            $query->whereHas('permissions', fn($q) => $q->whereIn('id', Arr::pluck($filters['permissions'], 'id')));
    }
}
