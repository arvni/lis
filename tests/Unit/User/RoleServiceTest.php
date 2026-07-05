<?php

namespace Tests\Unit\User;

use App\Domains\Shared\Contracts\SectionLookupInterface;
use App\Domains\User\Repositories\RoleRepository;
use App\Domains\User\Services\RoleService;
use Illuminate\Support\Collection;
use Mockery;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Pure-logic coverage for RoleService's two RBAC permission-tree transformers,
 * neither of which the Feature suite exercises directly:
 *
 *  - getSectionAndGroupSections(): the section-scoping rule that rewrites the
 *    numeric section / section-group ids embedded in `Sections.*` permission
 *    names into human names (via SectionLookupInterface), leaving Dashboard
 *    ids and every non-section permission untouched.
 *  - getName(): the recursive undot → nested {name,id,children} shaper that
 *    feeds the role-permission tree UI.
 *
 * Both are reached via reflection with a mocked repository and an in-memory
 * SectionLookup stand-in — no database is booted.
 */
class RoleServiceTest extends TestCase
{
    private RoleService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // A fixed lookup so the id → name substitution is deterministic.
        $lookup = new class implements SectionLookupInterface
        {
            public function getSectionNames(): Collection
            {
                return collect([5 => 'Hematology', 8 => 'Serology']);
            }

            public function getSectionGroupNames(): Collection
            {
                return collect([7 => 'Chemistry Group', 9 => 'Molecular Group']);
            }
        };

        // The repository is never touched by the transformers under test.
        $this->service = new RoleService(Mockery::mock(RoleRepository::class), $lookup);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(RoleService::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->service, ...$args);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getSectionAndGroupSections — section-scoping id → name substitution
    // ─────────────────────────────────────────────────────────────────────────

    public function test_substitutes_section_id_when_preceded_by_section_token(): void
    {
        $permissions = collect([(object) ['name' => 'Sections.Section.5.view']]);

        $result = $this->invoke('getSectionAndGroupSections', $permissions);

        $this->assertSame('Sections.Section.Hematology.view', $result->first()->name);
    }

    public function test_substitutes_group_id_when_not_section_and_not_dashboard(): void
    {
        // `7` is preceded by `Sections` (neither "Section" nor "Dashboard") so
        // it resolves through the section-GROUP lookup.
        $permissions = collect([(object) ['name' => 'Sections.7.manage']]);

        $result = $this->invoke('getSectionAndGroupSections', $permissions);

        $this->assertSame('Sections.Chemistry Group.manage', $result->first()->name);
    }

    public function test_leaves_dashboard_ids_numeric(): void
    {
        // A numeric segment preceded by "Dashboard" is intentionally left as-is.
        $permissions = collect([(object) ['name' => 'Sections.Dashboard.7']]);

        $result = $this->invoke('getSectionAndGroupSections', $permissions);

        $this->assertSame('Sections.Dashboard.7', $result->first()->name);
    }

    public function test_non_section_permissions_pass_through_and_sort_after_section_ones(): void
    {
        $permissions = collect([
            (object) ['name' => 'Users.viewAny'],
            (object) ['name' => 'Sections.Section.8.view'],
        ]);

        $result = $this->invoke('getSectionAndGroupSections', $permissions)->values();

        // Section permissions are merged ahead of the untouched non-section ones.
        $this->assertSame('Sections.Section.Serology.view', $result[0]->name);
        $this->assertSame('Users.viewAny', $result[1]->name);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getName — recursive {name,id,children} tree shaper
    // ─────────────────────────────────────────────────────────────────────────

    public function test_get_name_keeps_leaf_without_children_key(): void
    {
        $input = ['viewAny' => ['name' => 'Users.viewAny', 'id' => 1]];

        $result = $this->invoke('getName', $input);

        $this->assertSame(['viewAny' => ['name' => 'Users.viewAny', 'id' => 1]], $result);
        $this->assertArrayNotHasKey('children', $result['viewAny']);
    }

    public function test_get_name_nests_children_recursively(): void
    {
        // The shape Arr::undot() produces: a category with only nested actions.
        $input = [
            'Users' => [
                'viewAny' => ['name' => 'Users.viewAny', 'id' => 1],
                'delete' => ['name' => 'Users.delete', 'id' => 2],
            ],
        ];

        $result = $this->invoke('getName', $input);

        // The category itself carries no name/id, only a children map.
        $this->assertSame([], array_diff_key($result['Users'], ['children' => null]));
        $this->assertSame(
            [
                'viewAny' => ['name' => 'Users.viewAny', 'id' => 1],
                'delete' => ['name' => 'Users.delete', 'id' => 2],
            ],
            $result['Users']['children']
        );
    }
}
