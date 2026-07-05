<?php

namespace Tests\Unit\Laboratory;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Repositories\SectionRepository;
use App\Domains\Laboratory\Services\SectionService;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Gate;
use Mockery;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Pure-logic coverage for SectionService::prepareAccessibleSections — the
 * accessible-sections sidebar tree. It groups viewable sections under their
 * section group, drops sections the user cannot view, and nests a group under
 * its parent group (via `section_group_id`) when that parent is present.
 *
 * Gate::allows('view', …) is mocked and the models are built in memory (the
 * `sectionGroup` relation pre-set) so no database is booted.
 */
class SectionServiceTest extends TestCase
{
    private SectionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SectionService(Mockery::mock(SectionRepository::class));
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * @param  list<int>  $allowedSectionIds
     */
    private function mockGate(array $allowedSectionIds): void
    {
        Gate::shouldReceive('allows')->andReturnUsing(
            fn (string $ability, $model): bool => $model instanceof Section
                && in_array($model->id, $allowedSectionIds, true)
        );
    }

    private function makeGroup(int $id, string $name, ?int $parentId = null): SectionGroup
    {
        $group = new SectionGroup;
        $group->forceFill([
            'id' => $id,
            'name' => $name,
            'section_group_id' => $parentId,
            'icon' => "grp-$id",
        ]);

        return $group;
    }

    private function makeSection(int $id, string $name, SectionGroup $group): Section
    {
        $section = new Section;
        $section->forceFill(['id' => $id, 'name' => $name, 'icon' => "sec-$id"]);
        $section->setRelation('sectionGroup', $group);

        return $section;
    }

    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(SectionService::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->service, ...$args);
    }

    public function test_groups_viewable_sections_and_drops_denied_ones(): void
    {
        $group = $this->makeGroup(1, 'Chemistry');
        $sections = new EloquentCollection([
            $this->makeSection(10, 'Enzymes', $group),
            $this->makeSection(11, 'Electrolytes', $group),
        ]);
        // Only section 10 is viewable.
        $this->mockGate([10]);

        $tree = $this->invoke('prepareAccessibleSections', $sections);

        $this->assertCount(1, $tree);
        $this->assertSame('Chemistry', $tree[0]['title']);
        $this->assertSame('group', $tree[0]['type']);
        $this->assertCount(1, $tree[0]['child']);
        $this->assertSame('Enzymes', $tree[0]['child'][0]['title']);
        $this->assertSame('sections.show.10', $tree[0]['child'][0]['route']);
    }

    public function test_nests_child_group_under_its_parent_group(): void
    {
        $parentGroup = $this->makeGroup(1, 'Chemistry');
        $childGroup = $this->makeGroup(2, 'Molecular', parentId: 1);
        $sections = new EloquentCollection([
            $this->makeSection(10, 'Enzymes', $parentGroup),
            $this->makeSection(20, 'PCR', $childGroup),
        ]);
        $this->mockGate([10, 20]);

        $tree = $this->invoke('prepareAccessibleSections', $sections);

        // Only the top-level group is at the root; the child group is nested
        // inside it, after the parent's own section.
        $this->assertCount(1, $tree);
        $this->assertSame('Chemistry', $tree[0]['title']);
        $this->assertCount(2, $tree[0]['child']);
        $this->assertSame('Enzymes', $tree[0]['child'][0]['title']);
        $this->assertSame('Molecular', $tree[0]['child'][1]['title']);
        $this->assertSame('group', $tree[0]['child'][1]['type']);
        $this->assertSame('PCR', $tree[0]['child'][1]['child'][0]['title']);
    }

    public function test_child_group_stays_top_level_when_parent_absent(): void
    {
        // The child group references a parent (id 1) that is not in the tree
        // (no viewable section under it) → it falls back to the root.
        $childGroup = $this->makeGroup(2, 'Molecular', parentId: 1);
        $sections = new EloquentCollection([
            $this->makeSection(20, 'PCR', $childGroup),
        ]);
        $this->mockGate([20]);

        $tree = $this->invoke('prepareAccessibleSections', $sections);

        $this->assertCount(1, $tree);
        $this->assertSame('Molecular', $tree[0]['title']);
    }
}
