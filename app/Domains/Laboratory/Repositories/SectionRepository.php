<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\Section;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SectionRepository
{
    public function getAll(): Collection
    {
        return Section::all();
    }

    public function listSections(array $queryData): LengthAwarePaginator
    {
        $query = Section::withCount(["workflows", "acceptanceItemStates"])
            ->withAggregate("sectionGroup", "name")
            ->with(["sectionGroup:name,id"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatSection(array $sectionData): Section
    {
        $section = Section::query()->make($sectionData);
        $section->sectionGroup()->associate($sectionData["section_group_id"]);
        $section->save();
        UserActivityService::createUserActivity($section,ActivityType::CREATE);
        return $section;
    }

    public function updateSection(Section $section, array $sectionData): Section
    {

        $section->fill($sectionData);
        $section->sectionGroup()->associate($sectionData["section_group_id"]);
        if ($section->isDirty()) {
            $section->save();
            UserActivityService::createUserActivity($section,ActivityType::UPDATE);
        }
        return $section;
    }

    public function deleteSection(Section $section): void
    {
        $section->delete();
        UserActivityService::createUserActivity($section,ActivityType::DELETE);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["section_group"]["id"]))
            $query->whereHas("parent", fn($q) => $q->where("section_groups.id", $filters["section_group"]["id"]));
        if (isset($filters["section_group_id"]))
            $query->where("section_group_id", $filters["section_group_id"]);
        if (isset($filters["active"]))
            $query->where("active", $filters["active"]);
    }

}
