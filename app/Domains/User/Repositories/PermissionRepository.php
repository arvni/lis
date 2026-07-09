<?php

namespace App\Domains\User\Repositories;

use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Permission;

class PermissionRepository
{
    public function create(string $name): Permission
    {
        /** @var Permission $permission */
        $permission = Permission::findOrCreate($name);
        return $permission;
    }

    public function edit(Permission $permission, array $data): Permission
    {
        $permission->update($data);
        return $permission;
    }

    public function delete(Permission $permission): void
    {
        $permission->delete();
    }

    public function getPermissionByName(string $permissionName): ?Permission
    {
        try {
            /** @var Permission $permission */
            $permission = Permission::findByName($permissionName);
            return $permission;
        } catch (PermissionDoesNotExist) {
            // Absence is the expected miss for a lookup by name; anything
            // else (e.g. a DB error) propagates instead of returning null.
            return null;
        }
    }

    public function getUserAllPermissions(): \Illuminate\Support\Collection
    {
        return auth()->user()->getAllPermissions();
    }
}
