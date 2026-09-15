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

    /**
     * Active users that are listed by id or hold one of the given roles, each returned once.
     *
     * @param  list<int>  $userIds
     * @param  list<int>  $roleIds
     * @return Collection<int, User>
     */
    public function getActiveByIdsOrRoleIds(array $userIds, array $roleIds): Collection
    {
        return User::query()
            ->where('is_active', true)
            ->where(fn (Builder $query) => $query
                ->whereIn('id', $userIds)
                ->orWhereHas('roles', fn (Builder $roles) => $roles->whereIn('roles.id', $roleIds)))
            ->get();
    }

    /**
     * Active users as id/name pairs, optionally narrowed by name or username, ordered by name.
     *
     * @return Collection<int, User>
     */
    public function searchActiveForSelect(?string $search, int $limit = 50): Collection
    {
        return User::query()
            ->where('is_active', true)
            ->when($search !== null && $search !== '', fn (Builder $query) => $query->search(['name', 'username'], $search))
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name']);
    }

    /**
     * Active users holding the permission, directly or through a role. Throws when it does not exist.
     *
     * @return Collection<int, User>
     */
    public function getActiveUsersWithPermission(string $permission): Collection
    {
        return User::permission($permission)->where('is_active', true)->get();
    }

    /**
     * @param  list<int>  $ids
     * @return Collection<int, User>
     */
    public function getByIds(array $ids): Collection
    {
        return User::query()->whereIn('id', $ids)->get(['id', 'name', 'attendance_number']);
    }

    /**
     * Users whose attendance number (their HikCentral Employee ID) is one of the given numbers.
     *
     * @param  list<string>  $attendanceNumbers
     * @return Collection<int, User>
     */
    public function getByAttendanceNumbers(array $attendanceNumbers): Collection
    {
        return User::query()->whereIn('attendance_number', $attendanceNumbers)->get(['id', 'name', 'attendance_number']);
    }

    /**
     * The attendance numbers of the given users; users without one are left out.
     *
     * @param  list<int>  $userIds
     * @return array<int, string> keyed by user id
     */
    public function getAttendanceNumbersByIds(array $userIds): array
    {
        $numbers = [];
        $users = User::query()->whereIn('id', $userIds)->whereNotNull('attendance_number')->get(['id', 'attendance_number']);
        foreach ($users as $user) {
            $numbers[$user->id] = (string) $user->attendance_number;
        }

        return $numbers;
    }

    /**
     * Every attendance number in use.
     *
     * @return list<string>
     */
    public function getAttendanceNumbers(): array
    {
        return array_values(array_map(
            'strval',
            User::query()->whereNotNull('attendance_number')->pluck('attendance_number')->all()
        ));
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
