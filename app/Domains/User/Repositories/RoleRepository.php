<?php

namespace App\Domains\User\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\User\Models\Role;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;

class RoleRepository
{
    use LogsUserActivity;

    public function list(array $queryData): LengthAwarePaginator
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
        $this->logCreated($role);
        return $role;
    }

    public function edit(Role $role, array $data): Role
    {
        $role->update($data);
        $role->syncPermissions($data['permissions'] ?? []);
        $this->logUpdated($role);
        return $role;
    }

    public function delete(Role $role): void
    {
        $role->delete();
        $this->logDeleted($role);
    }

    public function getAdminRole():?Role
    {
        return Role::findByName("Admin");
    }

    public function getPermissions(): Collection
    {
        return Permission::query()->orderBy('name')->get(['name', 'id']);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\User\Models\Role>  $query
     */
    public function applyFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['search']))
            $query->search(['name'], $filters['search']);


        if (!empty($filters['permissions']))
            $query->whereHas('permissions', fn($q) => $q->whereIn('id', Arr::pluck($filters['permissions'], 'id')));
    }
}
