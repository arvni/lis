<?php

namespace App\Domains\User\Repositories;

use Exception;
use Spatie\Permission\Models\Permission;

class PermissionRepository
{
    public function create(string $name): Permission
    {
        return Permission::findOrCreate($name);
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

    public function getPermissionByName($permissionName): ?Permission
    {
        try {
            return Permission::findByName($permissionName);
        } catch (Exception $e) {
            return null;
        }
    }

    public function getUserAllPermissions()
    {
        return auth()->user()->getAllPermissions();
    }
}
