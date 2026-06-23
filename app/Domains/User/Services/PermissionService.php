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


    public function createPermission(string $permissionName): Permission
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

    public function getPermissionByName(string $permissionName): ?Permission
    {
        return $this->permissionRepository->getPermissionByName($permissionName);
    }

    public function getUserAllowedDocumentTags(): array
    {
        // Document permissions are named "Documents.<Tag Title>", where the title is the
        // tag value with underscores replaced by spaces and title-cased (see
        // RoleAndPermissionSeeder::getDocumentsPermissions). Reverse that mapping to
        // resolve each permission back to its DocumentTag, dropping permissions that
        // don't correspond to a tag (e.g. the CRUD "View Document" entries).
        return $this->permissionRepository->getUserAllPermissions()
            ->pluck('name')
            ->filter(fn($permission) => Str::startsWith($permission, "Documents."))
            ->map(fn($permission) => DocumentTag::find(
                Str::upper(str_replace(' ', '_', Str::after($permission, "Documents.")))
            ))
            ->filter()
            ->values()
            ->all();
    }

}
