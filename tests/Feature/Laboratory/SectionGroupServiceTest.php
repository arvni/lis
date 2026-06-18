<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\SectionGroupDTO;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Repositories\SectionGroupRepository;
use App\Domains\Laboratory\Services\SectionGroupService;
use App\Domains\User\Models\User;
use Exception;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Mockery;
use Tests\TestCase;

class SectionGroupServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    private function dto(array $data = ['name' => 'G']): SectionGroupDTO
    {
        $dto = Mockery::mock(SectionGroupDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    // ── CRUD (mocked repo) ───────────────────────────────────────────────────────

    public function test_list_delegates(): void
    {
        $repo = Mockery::mock(SectionGroupRepository::class);
        $paginator = new LengthAwarePaginator([], 0, 10);
        $repo->shouldReceive('ListSectionGroups')->once()->with([])->andReturn($paginator);
        $this->assertSame($paginator, (new SectionGroupService($repo))->listSectionGroups([]));
    }

    public function test_store_delegates(): void
    {
        $repo = Mockery::mock(SectionGroupRepository::class);
        $group = new SectionGroup();
        $repo->shouldReceive('creatSectionGroup')->once()->with(['name' => 'G'])->andReturn($group);
        $this->assertSame($group, (new SectionGroupService($repo))->storeSectionGroup($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $repo = Mockery::mock(SectionGroupRepository::class);
        $group = new SectionGroup();
        $repo->shouldReceive('updateSectionGroup')->once()->with($group, ['name' => 'G'])->andReturn($group);
        $this->assertSame($group, (new SectionGroupService($repo))->updateSectionGroup($group, $this->dto()));
    }

    public function test_delete_removes_group_without_children_or_sections(): void
    {
        $repo = Mockery::mock(SectionGroupRepository::class);
        $group = $this->groupWith(childrenExist: false, sectionsExist: false);
        $repo->shouldReceive('deleteSectionGroup')->once()->with($group)->andReturnNull();
        (new SectionGroupService($repo))->deleteSectionGroup($group);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_group_has_sections(): void
    {
        $repo = Mockery::mock(SectionGroupRepository::class);
        $group = $this->groupWith(childrenExist: false, sectionsExist: true);
        $repo->shouldNotReceive('deleteSectionGroup');
        $this->expectException(Exception::class);
        (new SectionGroupService($repo))->deleteSectionGroup($group);
    }

    private function groupWith(bool $childrenExist, bool $sectionsExist): SectionGroup
    {
        $childrenRel = Mockery::mock(HasMany::class);
        $childrenRel->shouldReceive('exists')->andReturn($childrenExist);
        $sectionsRel = Mockery::mock(HasMany::class);
        $sectionsRel->shouldReceive('exists')->andReturn($sectionsExist);

        $group = Mockery::mock(SectionGroup::class)->makePartial();
        $group->shouldReceive('children')->andReturn($childrenRel);
        $group->shouldReceive('sections')->andReturn($sectionsRel);
        return $group;
    }

    // ── extractRoutes / getPermittedIds ──────────────────────────────────────────

    public function test_extract_routes_flattens_nested_tree(): void
    {
        $service = app(SectionGroupService::class);
        $routes = $service->extractRoutes([
            ['route' => 'a', 'child' => [
                ['route' => 'b'],
                ['child' => [['route' => 'c']]],
            ]],
        ]);

        $this->assertSame(['a', 'b', 'c'], $routes);
    }

    public function test_get_permitted_ids_splits_section_and_group_routes(): void
    {
        Cache::put("user-{$this->user->id}-section-routes", [
            ['route' => 'sections.show.5'],
            ['route' => 'sectionGroups.show.3'],
            ['route' => 'dashboard'],
        ]);

        [$groups, $sections] = app(SectionGroupService::class)->getPermittedIds();

        $this->assertSame(['3'], $groups);
        $this->assertSame(['5'], $sections);
    }

    public function test_get_permitted_ids_handles_cold_cache(): void
    {
        // Regression: a missing cache entry used to pass null to extractRoutes()
        // and throw a TypeError; it must now self-populate and return arrays.
        Gate::before(fn () => true);
        Cache::forget("user-{$this->user->id}-section-routes");

        [$groups, $sections] = app(SectionGroupService::class)->getPermittedIds();

        $this->assertIsArray($groups);
        $this->assertIsArray($sections);
    }

    // ── Nested / transformed trees (real DB) ─────────────────────────────────────

    public function test_get_all_nested_section_groups_returns_top_level(): void
    {
        $parent = SectionGroup::create(['name' => 'Top', 'active' => true]);
        SectionGroup::create(['name' => 'Child', 'active' => true, 'section_group_id' => $parent->id]);

        $groups = app(SectionGroupService::class)->getAllNestedSectionGroups();

        $this->assertCount(1, $groups);
        $this->assertSame('Top', $groups->first()->name);
    }

    public function test_get_transformed_section_groups_builds_tree(): void
    {
        Gate::before(fn () => true);
        $group = SectionGroup::create(['name' => 'Chemistry', 'active' => true]);
        Section::create(['name' => 'Glucose', 'section_group_id' => $group->id]);

        $tree = app(SectionGroupService::class)->getTransformedSectionGroups();

        $this->assertNotEmpty($tree);
        $this->assertSame('Chemistry', $tree[0]['title']);
        $this->assertSame('group', $tree[0]['type']);
        $this->assertNotEmpty($tree[0]['child']);
    }

    public function test_get_section_group_with_children_and_section_loads_relations(): void
    {
        $group = SectionGroup::create(['name' => 'Parent', 'active' => true]);
        $section = Section::create(['name' => 'S1', 'section_group_id' => $group->id]);

        Cache::put("user-{$this->user->id}-section-routes", [
            ['route' => 'sections.show.' . $section->id],
            ['route' => 'sectionGroups.show.' . $group->id],
        ]);

        $loaded = app(SectionGroupService::class)->getSectionGroupWithChildrenAndSection($group);

        $this->assertTrue($loaded->relationLoaded('sections'));
        $this->assertTrue($loaded->relationLoaded('children'));
    }

    public function test_list_acceptance_items_returns_paginator(): void
    {
        $group = SectionGroup::create(['name' => 'Empty', 'active' => true]);
        $result = app(SectionGroupService::class)->listAcceptanceItems($group, []);
        $this->assertInstanceOf(LengthAwarePaginator::class, $result);
        $this->assertSame(0, $result->total());
    }
}
