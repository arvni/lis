<?php

namespace App\Domains\User\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

class UserRepository
{
    public function all(array $queryData = []): LengthAwarePaginator
    {
        $query = User::query()->with('roles');
        if (isset($queryData["filters"]))
            $this->apalyFilters($query, $queryData["filters"]);

        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');

        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function find(int $id): ?User
    {
        return User::with('roles')->find($id);
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function findOrFail(int $id): User
    {
        return User::findOrFail($id);
    }

    /**
     * Active users as id/name pairs, ordered by name (for select lists).
     *
     * @return Collection<int, User>
     */
    public function getActiveForSelect(): Collection
    {
        return User::where('is_active', true)->orderBy('name')->get(['id', 'name']);
    }

    /**
     * Users holding the given role (web guard). Throws when the role does not exist.
     *
     * @return Collection<int, User>
     */
    public function getUsersByRoleName(string $roleName): Collection
    {
        $role = Role::findByName($roleName, 'web');

        return User::role($role)->get();
    }

    public function create(array $data): User
    {

        return User::create($data);
    }

    /**
     * Set a user's (already-hashed) password by id.
     */
    public function updatePasswordById(int $id, string $hashedPassword): void
    {
        User::where('id', $id)->update(['password' => $hashedPassword]);
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

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\User\Models\User>  $query
     */
    public function apalyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["name","username","email","mobile","title"],$filters["search"]);

        if (!empty($filters['role'])) {
            $query->whereHas('roles', fn($q) => $q->where('id', $filters['role']['id']));
        }
    }
}
