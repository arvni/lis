<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\SectionGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SectionGroupRepository
{

    public function listSectionGroups(array $queryData): LengthAwarePaginator
    {
        $query = SectionGroup::withCount(["children", "sections"])
            ->withAggregate("parent", "name")
            ->with("parent:name,id");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatSectionGroup(array $sectionGroupData): SectionGroup
    {
        $sectionGroup = SectionGroup::query()->make($sectionGroupData);
        $sectionGroup->parent()->associate($sectionGroupData["section_group_id"]);
        $sectionGroup->save();
        return $sectionGroup;
    }

    public function updateSectionGroup(SectionGroup $sectionGroup, array $sectionGroupData): SectionGroup
    {
        $sectionGroup->fill($sectionGroupData);
        $sectionGroup->parent()->associate($sectionGroupData["section_group_id"]);
        if ($sectionGroup->isDirty())
            $sectionGroup->save();
        return $sectionGroup;
    }

    public function deleteSectionGroup(SectionGroup $sectionGroup): void
    {
        $sectionGroup->delete();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["parent"]["id"]))
            $query->whereHas("parent", fn($q) => $q->where("section_groups.id", $filters["parent"]["id"]));
    }

}
