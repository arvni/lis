<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\User\Models\User;

class SectionGroupPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Section Groups.List Section Groups");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SectionGroup $sectionGroup): bool
    {
        $ids=$this->getSectionGroupIds($sectionGroup);
        return $user->can("Sections." . implode(".", $ids));
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Section Groups.Create Section Group");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SectionGroup $sectionGroup): bool
    {
        return $user->can("Advance Settings.Section Groups.Edit Section Group");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SectionGroup $sectionGroup): bool
    {
        return $user->can("Advance Settings.Section Groups.Delete Section Group");
    }

    private function getSectionGroupIds($sectionGroup): array
    {
        if (isset($sectionGroup["parent"]) && $sectionGroup["section_group_id"]) {
            return [... $this->getSectionGroupIds($sectionGroup["parent"]), $sectionGroup["id"]];
        }
        return [$sectionGroup["id"]];
    }
}
