<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\SectionDTO;
use App\Domains\Laboratory\Enums\ActionType;
use App\Domains\Laboratory\Events\SectionEvent;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Repositories\SectionRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Gate;

class SectionService
{
    public function __construct(private SectionRepository $sectionRepository)
    {
    }

    public function listSections($queryData): LengthAwarePaginator
    {
        return $this->sectionRepository->ListSections($queryData);
    }

    public function storeSection(SectionDTO $sectionDTO): Section
    {
        $section = $this->sectionRepository->creatSection($sectionDTO->toArray());
        $section->load("sectionGroup");
        SectionEvent::dispatch(ActionType::CREATE, $section->toArray(), []);
        return $section;
    }

    public function updateSection(Section $section, SectionDTO $sectionDTO): Section
    {
        $section->load("sectionGroup");
        $oldSectionData = $section->toArray();
        $section = $this->sectionRepository->updateSection($section, $sectionDTO->toArray());
        $section->load("sectionGroup");
        SectionEvent::dispatch(ActionType::UPDATE, $section->toArray(), $oldSectionData);
        return $section;
    }

    /**
     * @throws Exception
     */
    public function deleteSection(Section $section): void
    {
        $sectionData = $section->toArray();
        if (!$section->acceptanceItemStates()->exists() && !$section->workflows()->exists()) {
            $this->sectionRepository->deleteSection($section);
            SectionEvent::dispatch(ActionType::DELETE, $sectionData);
        } else
            throw new Exception("This section has some Acceptance or participate in Workflow");
    }

    public function getAccessibleSections(): array
    {
        $sections = $this->sectionRepository->getAll();
        return $this->prepareAccessibleSections($sections);
    }

    protected function prepareAccessibleSections(Collection $sections): array
    {
        $tree = [];
        $groups = [];

        foreach ($sections as $section) {
            $group = $section->sectionGroup;
            if (!Gate::allows("view", $section))
                continue;
            if (!isset($groups[$group->id])) {
                $groups[$group->id] = [
                    'title' => $group->name,
                    'parent_id' => $group->parent_id,
                    'child' => [],
                    'type' => 'group',
                    'icon' => $group->icon,
                ];
            }

            $groups[$group->id]['child'][] = [
                'title' => $section->name,
                'route' => 'sections.show.' . $section->id,
                'type' => 'section',
                'icon' => $section->icon
            ];
        }


        foreach ($groups as $id => &$group) {
            if ($group['parent_id'] && isset($groups[$group['parent_id']])) {
                $groups[$group['parent_id']]['child'][] = &$group;
            } else {
                $tree[] = &$group;
            }
        }
        return $tree;
    }

}
