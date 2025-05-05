<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\User\Models\User;

class SectionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Sections.List Sections");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Section $section): bool
    {
        $section->load("sectionGroup");
        $prefix = $this->getSectionGroupPrefix($section->sectionGroup);
        return $user->can("Sections$prefix.Section.$section->id");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Sections.Create Section");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Section $section): bool
    {
        return $user->can("Advance Settings.Sections.Edit Section");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Section $section): bool
    {
        return $user->can("Advance Settings.Sections.Delete Section");
    }

    public function action(User $user, Section $section, string $action): bool
    {
        $section->load("sectionGroup");
        $prefix = $this->getSectionGroupPrefix($section->sectionGroup);
        return $user->can("Sections$prefix.Section.$section->id.$action");
    }

    private function getSectionGroupPrefix(SectionGroup $sectionGroup): string
    {
        $idList = $this->getSectionGroupIds($sectionGroup);
        $prefix = "";
        foreach ($idList as $id) {
            $prefix .= ".$id";
        }
        return $prefix;
    }

    private function getSectionGroupIds($sectionGroup): array
    {
        if (isset($sectionGroup->parent) && $sectionGroup->section_group_id) {
            return [... $this->getSectionGroupIds($sectionGroup->parent), $sectionGroup->id];
        }
        return [$sectionGroup->id];
    }

}
