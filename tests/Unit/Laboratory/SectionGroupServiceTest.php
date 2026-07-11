<?php

namespace Tests\Unit\Laboratory;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Repositories\SectionGroupRepository;
use App\Domains\Laboratory\Services\SectionGroupService;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Gate;
use Mockery;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Pure-logic coverage for SectionGroupService's navigation-tree builders — the
 * section-access rules that decide which groups/sections a user sees in the
 * sidebar. These branch entirely on Gate::allows('view', …), so the Gate facade
 * is mocked and the models are built in memory (relations pre-set to avoid any
 * DB access / lazy loading). Covered:
 *
 *  - transformGroups(): the recursive access filter — a section shows only when
 *    viewable; a group with no view permission is still emitted (route-less) if
 *    it has any viewable descendant, and pruned entirely otherwise.
 *  - extractRoutes(): flattens the tree into the route list getPermittedIds()
 *    parses.
 */
class SectionGroupServiceTest extends TestCase
{
    private SectionGroupService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SectionGroupService(Mockery::mock(SectionGroupRepository::class));
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(SectionGroupService::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->service, ...$args);
    }

    /**
     * Route Gate::allows('view', …) through explicit id allow-lists per type.
     *
     * @param  list<int>  $groups
     * @param  list<int>  $sections
     */
    private function mockGate(array $groups, array $sections): void
    {
        Gate::shouldReceive('allows')->andReturnUsing(
            function (string $ability, $model) use ($groups, $sections): bool {
                if ($model instanceof SectionGroup) {
                    return in_array($model->id, $groups, true);
                }
                if ($model instanceof Section) {
                    return in_array($model->id, $sections, true);
                }

                return false;
            }
        );
    }

    /**
     * @param  list<Section>  $sections
     * @param  list<SectionGroup>  $children
     */
    private function makeGroup(int $id, string $name, array $sections = [], array $children = []): SectionGroup
    {
        $group = new SectionGroup;
        $group->forceFill(['id' => $id, 'name' => $name, 'icon' => "grp-$id"]);
        $group->setRelation('sections', new EloquentCollection($sections));
        $group->setRelation('recursiveChildren', new EloquentCollection($children));

        return $group;
    }

    private function makeSection(int $id, string $name): Section
    {
        $section = new Section;
        $section->forceFill(['id' => $id, 'name' => $name, 'icon' => "sec-$id"]);

        return $section;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // transformGroups
    // ─────────────────────────────────────────────────────────────────────────

    public function test_viewable_group_emits_route_and_only_viewable_sections(): void
    {
        $group = $this->makeGroup(1, 'Chemistry', [
            $this->makeSection(10, 'Enzymes'),
            $this->makeSection(11, 'Electrolytes'),
        ]);
        // Group + section 10 viewable, section 11 denied.
        $this->mockGate([1], [10]);

        $result = $this->invoke('transformGroups', new EloquentCollection([$group]));

        $this->assertCount(1, $result);
        $this->assertSame('Chemistry', $result[0]['title']);
        $this->assertSame('sectionGroups.show.1', $result[0]['route']);

        // Only the viewable section survives, shaped for the sidebar.
        $this->assertCount(1, $result[0]['child']);
        $this->assertSame('Enzymes', $result[0]['child'][0]['title']);
        $this->assertSame('sections.show.10', $result[0]['child'][0]['route']);
        $this->assertSame('section', $result[0]['child'][0]['type']);
    }

    public function test_non_viewable_group_with_viewable_child_is_kept_without_route(): void
    {
        $group = $this->makeGroup(1, 'Chemistry', [$this->makeSection(10, 'Enzymes')]);
        // Group NOT viewable, but its section is — the group stays as a
        // non-clickable container so the child remains reachable.
        $this->mockGate([], [10]);

        $result = $this->invoke('transformGroups', new EloquentCollection([$group]));

        $this->assertCount(1, $result);
        $this->assertArrayNotHasKey('route', $result[0]);
        $this->assertCount(1, $result[0]['child']);
        $this->assertSame('Enzymes', $result[0]['child'][0]['title']);
    }

    public function test_non_viewable_group_with_no_viewable_descendant_is_pruned(): void
    {
        $group = $this->makeGroup(1, 'Chemistry', [$this->makeSection(10, 'Enzymes')]);
        // Nothing viewable → the whole branch is dropped.
        $this->mockGate([], []);

        $result = $this->invoke('transformGroups', new EloquentCollection([$group]));

        $this->assertSame([], $result);
    }

    public function test_recursive_children_are_appended_as_groups(): void
    {
        $child = $this->makeGroup(2, 'Molecular', [$this->makeSection(20, 'PCR')]);
        $parent = $this->makeGroup(1, 'Chemistry', [], [$child]);
        $this->mockGate([1, 2], [20]);

        $result = $this->invoke('transformGroups', new EloquentCollection([$parent]));

        $this->assertCount(1, $result);
        // Parent's child list holds the transformed sub-group, re-typed 'group'.
        $this->assertCount(1, $result[0]['child']);
        $this->assertSame('Molecular', $result[0]['child'][0]['title']);
        $this->assertSame('group', $result[0]['child'][0]['type']);
        // …which itself carries its viewable section.
        $this->assertSame('PCR', $result[0]['child'][0]['child'][0]['title']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // extractRoutes
    // ─────────────────────────────────────────────────────────────────────────

    public function test_extract_routes_walks_nested_children_and_skips_routeless_nodes(): void
    {
        $items = [
            [
                'route' => 'sectionGroups.show.1',
                'child' => [
                    ['route' => 'sections.show.10'],
                    // A route-less container with a nested route.
                    ['child' => [['route' => 'sections.show.11']]],
                ],
            ],
            ['title' => 'no route here'],
        ];

        $routes = $this->invoke('extractRoutes', $items);

        $this->assertSame(
            ['sectionGroups.show.1', 'sections.show.10', 'sections.show.11'],
            $routes
        );
    }

}
