<?php

namespace App\Domains\User\Services;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\User\Models\Role;
use App\Domains\User\Repositories\RoleRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class RoleService
{
    public function __construct(protected RoleRepository $roleRepository)
    {
    }

    public function listRoles(array $filters): LengthAwarePaginator
    {
        return $this->roleRepository->list($filters);
    }

    public function createRole(array $data): Role
    {
        return $this->roleRepository->create($data);
    }

    public function updateRole(Role $role, array $data): Role
    {
        return $this->roleRepository->edit($role, $data);
    }

    public function deleteRole(Role $role): void
    {
        $this->roleRepository->delete($role);
    }

    public function getAdminRole()
    {
        return $this->roleRepository->getAdminRole();
    }

    public function preparePermissions()
    {
        $permissions = $this->roleRepository->getPermissions();
        $permissions = $this->getSectionAndGroupSections($permissions);
        return $this->getName(Arr::undot($permissions->keyBy("name")->toArray()));
    }

    protected function getName($permissions)
    {
        $output = [];
        foreach ($permissions as $key => $value) {
            $cat = $key;
            $v = Arr::only($value, ["name", "id"]);
            $output[$cat] = $v;
            if (count(Arr::except($value, ["name", "id"]))) {
                $output[$cat] = [
                    ...$output[$cat],
                    "children" => $this->getName(Arr::except($value, ["name", "id"]))
                ];
            }
        }
        return $output;
    }

    private function getSectionAndGroupSections(Collection $permissions): \Illuminate\Support\Collection
    {
        $nonSectionPermissions = collect([]);
        $sectionPermissions = collect([]);
        $permissions->each(function ($permission) use (&$sectionPermissions, &$nonSectionPermissions) {
            if (Str::startsWith($permission->name, "Sections.")) {
                $sectionPermissions->add($permission);
            } else {
                $nonSectionPermissions->add($permission);
            }
        });
        $sectionGroups = SectionGroup::all()->keyBy("id")->map(fn($item) => $item->name);
        $sections = Section::all()->keyBy("id")->map(fn($item) => $item->name);
        $sectionPermissions->map(function ($permission) use ($sectionGroups, $sections) {
                $name = $permission->name;
                $names = explode(".", $name);
                foreach ($names as $key => $value) {
                    if (is_numeric($value)) {
                        if ($key >= 1) {
                            if ($names[$key - 1] == "Section")
                                $names[$key] = $sections[$value];
                            elseif ($names[$key - 1] !== "Dashboard")
                                $names[$key] = $sectionGroups[$value];
                        }
                    }
                }
                $permission->name = implode(".", $names);
                return $permission;
            });
        return $sectionPermissions->merge($nonSectionPermissions);
    }

}
