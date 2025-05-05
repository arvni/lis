<?php

namespace App\Domains\User\Listeners;

use App\Domains\Laboratory\Enums\ActionType;
use App\Domains\User\Services\PermissionService;
use App\Domains\User\Services\RoleService;

class SectionPermissionsListener
{
    /**
     * Create the event listener.
     */
    public function __construct(protected PermissionService $permissionService, private RoleService $roleService)
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        switch ($event->action) {
            case ActionType::CREATE:
                $this->createSectionPermissions($event->sectionData);
                break;
            case ActionType::UPDATE:
                $this->updateSectionPermissions($event->sectionData, $event->sectionOldData);
                break;
            case ActionType::DELETE:
                $this->deleteSectionPermissions($event->sectionData);
                break;

        }
    }

    private function permissions($sectionId, $sectionGroup): array
    {
        [$prefix, $sectionGroupPermissions] = $this->getSectionGroupPermission($sectionGroup);
        return [
            ...$sectionGroupPermissions,
            ... $this->getSectionPermissions($sectionId, $prefix)
        ];
    }

    private function createSectionPermissions(array $sectionData): void
    {
        $permissions = [];
        $permissionNames = $this->permissions($sectionData["id"], $sectionData["parent"]);
        foreach ($permissionNames as $permissionName) {
            $permissions[] = $this->permissionService->createPermission($permissionName);
        }
        $adminRole = $this->roleService->getAdminRole();
        $adminRole?->givePermissionTo($permissions);
    }

    private function updateSectionPermissions($newData, $oldData): void
    {
        $permissions = [];
        $oldPermissions = $this->permissions($oldData["id"], $oldData["section_group"]);
        $newPermissions = $this->permissions($newData["id"], $newData["section_group"]);
        $adminRole = $this->roleService->getAdminRole();
        foreach ($oldPermissions as $key => $OldPermissionName) {
            $permission = $this->permissionService->getPermissionByName($OldPermissionName);
            if ($permission)
                $this->permissionService->updatePermission($permission, ["name" => $newPermissions[$key]]);
            else
                $permission = $this->permissionService->createPermission($newPermissions[$key]);
            $permissions[] = $permission;
        }
        $adminRole?->givePermissionTo($permissions);
    }

    private function deleteSectionPermissions($sectionData): void
    {
        [$prefix, $_] = $this->getSectionGroupPermission($sectionData["section_group"]);
        $permissionNames = $this->getSectionPermissions($sectionData["id"], $prefix);
        foreach ($permissionNames as $permissionName) {
            $permissionName = $this->permissionService->getPermissionByName($permissionName);
            $this->permissionService->deletePermission($permissionName);
        }
    }

    private function getSectionPermissions($sectionId, $prefix): array
    {
        return [
            "Sections$prefix.Section.$sectionId",
            "Sections$prefix.Section.$sectionId.Done",
            "Sections$prefix.Section.$sectionId.Enter",
            "Sections$prefix.Section.$sectionId.Update",
            "Sections$prefix.Section.$sectionId.Reject",
            "Sections$prefix.Section.$sectionId.Dashboard.Total Processing Samples",
            "Sections$prefix.Section.$sectionId.Dashboard.Total Finished Samples",
            "Sections$prefix.Section.$sectionId.Dashboard.Total Started",
            "Sections$prefix.Section.$sectionId.Dashboard.Total Average Duration",
        ];
    }


    private function getSectionGroupPermission($sectionGroup): array
    {
        $idList = $this->getSectionGroupIds($sectionGroup);
        $output = [];
        $tmp = "";
        foreach ($idList as $id) {
            $tmp .= ".$id";
            $output[] = "Sections$tmp";
        }
        return [$tmp, $output];
    }

    private function getSectionGroupIds($sectionGroup): array
    {
        if (isset($sectionGroup["parent"]) && $sectionGroup["section_group_id"]) {
            return [... $this->getSectionGroupIds($sectionGroup["parent"]), $sectionGroup["id"]];
        }
        return [$sectionGroup["id"]];
    }
}
