<?php

declare(strict_types=1);

namespace App\Domains\Laboratory\Repositories;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\Section;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SectionRepository
{
    use LogsUserActivity;

    /**
     * @return Collection<int, Section>
     */
    public function getAll(): Collection
    {
        return Section::all();
    }

    /**
     * Active sections (id + name only), ordered by name — for lightweight selects.
     *
     * @return Collection<int, Section>
     */
    public function getActiveOrdered(): Collection
    {
        return Section::without('sectionGroup')->active()->orderBy('name')->get(['id', 'name']);
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
        $this->logCreated($section);
        return $section;
    }

    public function updateSection(Section $section, array $sectionData): Section
    {

        $section->fill($sectionData);
        $section->sectionGroup()->associate($sectionData["section_group_id"]);
        if ($section->isDirty()) {
            $section->save();
            $this->logUpdated($section);
        }
        return $section;
    }

    public function deleteSection(Section $section): void
    {
        $section->delete();
        $this->logDeleted($section);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Laboratory\Models\Section>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["section_group"]["id"]))
            $query->whereHas("sectionGroup", fn($q) => $q->where("section_groups.id", $filters["section_group"]["id"]));
        if (isset($filters["section_group_id"]))
            $query->where("section_group_id", $filters["section_group_id"]);
        if (isset($filters["active"]))
            $query->where("active", $filters["active"]);
    }

}
