<?php

namespace App\Domains\User\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\User\Repositories\PermissionRepository;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;

class PermissionService
{
    public function __construct(protected PermissionRepository $permissionRepository)
    {
    }


    public function createPermission($permissionName): Permission
    {
        return $this->permissionRepository->create($permissionName);
    }

    public function updatePermission(Permission $permission, array $data): Permission
    {
        return $this->permissionRepository->edit($permission, $data);
    }

    public function deletePermission(Permission $permission): void
    {
        $this->permissionRepository->delete($permission);
    }

    public function getPermissionByName($permissionName): ?Permission
    {
        return $this->permissionRepository->getPermissionByName($permissionName);
    }

    public function getUserAllowedDocumentTags(): array
    {
        $permissions = $this->permissionRepository->getUserAllPermissions();
        return $permissions
            ->pluck('name')
            ->filter(fn($permission) => Str::startsWith("Documents.", $permission))
            ->map(fn($permission) => DocumentTag::find(Str::snake(Str::upper(Str::after($permission, "Documents.")))));
    }

}
