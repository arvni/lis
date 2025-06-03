<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\SectionGroupDTO;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Repositories\SectionGroupRepository;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class SectionGroupService
{
    public function __construct(private SectionGroupRepository $sectionGroupRepository)
    {
    }

    public function listSectionGroups($queryData)
    {
        return $this->sectionGroupRepository->ListSectionGroups($queryData);
    }

    public function storeSectionGroup(SectionGroupDTO $sectionGroupDTO)
    {
        return $this->sectionGroupRepository->creatSectionGroup($sectionGroupDTO->toArray());
    }

    public function updateSectionGroup(SectionGroup $sectionGroup, SectionGroupDTO $sectionGroupDTO): SectionGroup
    {
        return $this->sectionGroupRepository->updateSectionGroup($sectionGroup, $sectionGroupDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteSectionGroup(SectionGroup $sectionGroup): void
    {
        if (!$sectionGroup->children()->exists() && !$sectionGroup->sections()->exists()) {
            $this->sectionGroupRepository->deleteSectionGroup($sectionGroup);
        } else
            throw new Exception("This section group has some Section or Section Group");
    }

    public function getSectionGroupWithChildrenAndSection(SectionGroup $sectionGroup)
    {
        list($permittedSectionGroups, $permittedSections) = $this->getPermittedIds();
        $sectionGroup->load([
            'sections' => function ($q) use ($permittedSections) {
                $q->whereIn('sections.id', $permittedSections);
                $q->isActive();
                $q->withCount([
                    "waitingItems",
                    "processingItems",
                    "finishedItems",
                    "rejectedItems",
                ]);
            },
            'children' => function ($q) use ($permittedSectionGroups) {
                $q->whereIn("section_groups.id", $permittedSectionGroups);
                $q->active();
                $q->withCount([
                    "waitingItems",
                    "processingItems",
                    "finishedItems",
                    "sections"
                ]);
            },
            'parent']);
        return $sectionGroup;
    }


    /**
     * Get all section groups in a nested structure
     *
     * @return Collection
     */
    public function getAllNestedSectionGroups()
    {

        // Get all top-level section groups (without parent)
        $nestedGroups = SectionGroup::withoutParent()
            ->with([
                'sections',               // Include sections for top-level groups
                'recursiveChildren',      // Include all children recursively
                'recursiveChildren.sections', // Include sections for all children
            ])
            ->active()  // Optional: only get active groups
            ->get();

        return $nestedGroups;
    }


    /**
     * Get transformed section groups with merged children and sections
     *
     * @return array
     */
    public function getTransformedSectionGroups(): array
    {
        // First get the nested structure
        $nestedGroups = $this->getAllNestedSectionGroups();

        // Then transform it with a recursive function
        return $this->transformGroups($nestedGroups);
    }

    /**
     * Transform section groups recursively
     *
     * @param Collection $groups
     * @return array
     */
    private function transformGroups($groups)
    {
        $result = [];

        foreach ($groups as $group) {
            if (!Gate::allows("view", $group))
                continue;
            $groupData = [
                'id' => $group->id,
                'icon' => $group->icon,
                'title' => $group->name, // renamed 'name' to 'title'
                'child' => [],// will contain merged sections and children
                'type' => 'group',
                'route' => 'sectionGroups.show.' . $group->id
            ];

            // Add sections to items
            foreach ($group->sections as $section) {
                if (!Gate::allows("view", $section))
                    continue;
                $groupData['child'][] = [
                    'id' => $section->id,
                    'icon' => $section->icon,
                    'title' => $section->name, // renamed 'name' to 'title'
                    'type' => 'section', // to differentiate between sections and groups,
                    'route' => 'sections.show.' . $section->id
                ];
            }

            // Recursively transform and add children to items
            if ($group->recursiveChildren && $group->recursiveChildren->count() > 0) {
                $transformedChildren = $this->transformGroups($group->recursiveChildren);
                foreach ($transformedChildren as $child) {
                    $child['type'] = 'group'; // to differentiate between sections and groups
                    $groupData['child'][] = $child;
                }
            }

            $result[] = $groupData;
        }

        return $result;
    }


    /**
     * Transform a single section group for detailed view
     *
     * @param SectionGroup $group
     * @return array
     */
    private function transformSingleGroup(SectionGroup $group): array
    {
        return [
            'id' => $group->id,
            'name' => $group->name,
            'icon' => $group->icon,
            'active' => $group->active,
            'description' => $group->description ?? '',
            'parent' => $group->parent ? [
                'id' => $group->parent->id,
                'name' => $group->parent->name,
                'icon' => $group->parent->icon,
            ] : null,
            'breadcrumbs' => $this->generateBreadcrumbs($group),
            'children' => $group->children->map(function ($child) {
                return [
                    'id' => $child->id,
                    'name' => $child->name,
                    'icon' => $child->icon,
                    'type' => 'sectionGroup',
                    'sectionsCount' => $child->sections_count,
                    'active' => $child->active
                ];
            }),
            'sections' => $group->sections->map(function ($section) {
                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'icon' => $section->icon,
                    'description' => $section->description,
                    'type' => 'section',
                    'active' => $section->active,
                    "waiting_items_count" => $section->waiting_items_count,
                    "processing_items_count" => $section->processing_items_count,
                    "finished_items_count" => $section->finished_items_count,
                    "rejected_items_count" => $section->rejected_items_count,
                    "total_items_count" => $section->waiting_items_count + $section->processing_items_count + $section->finished_items_count + $section->rejected_items_count
                ];
            })
        ];
    }

    /**
     * Generate breadcrumbs for a section group
     *
     * @param SectionGroup $group
     * @return array
     */
    private function generateBreadcrumbs(SectionGroup $group)
    {
        $breadcrumbs = [
            [
                'id' => $group->id,
                'name' => $group->name,
                'icon' => $group->icon
            ]
        ];

        $parent = $group->parent;
        while ($parent) {
            array_unshift($breadcrumbs, [
                'id' => $parent->id,
                'name' => $parent->name,
                'icon' => $parent->icon
            ]);
            $parent = $parent->parent;
        }

        return $breadcrumbs;
    }

    public function getPermittedIds(): array
    {
        $user = auth()->user();
        $sectionRoutes = "user-$user->id-section-routes";
        $extractedRoutes = $this->extractRoutes(cache()->get($sectionRoutes));
        $sections = [];
        $sectionGroups = [];
        foreach ($extractedRoutes as $route) {
            if (Str::startsWith($route, "sections.show.")) {
                $sections[] = last(explode(".", $route));
            } elseif (Str::startsWith($route, "sectionGroups.show.")) {
                $sectionGroups[] = last(explode(".", $route));
            }
        }
        return [$sectionGroups, $sections];
    }

    function extractRoutes(array $items, array &$routes = []): array
    {
        foreach ($items as $item) {
            if (isset($item['route'])) {
                $routes[] = $item['route'];
            }

            if (isset($item['child']) && is_array($item['child'])) {
                $this->extractRoutes($item['child'], $routes);
            }
        }

        return $routes;
    }


}
