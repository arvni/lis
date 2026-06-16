<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\SectionDTO;
use App\Domains\Laboratory\Events\SectionEvent;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Repositories\SectionRepository;
use App\Domains\Laboratory\Services\SectionService;
use App\Domains\User\Models\User;
use Exception;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Mockery;
use Tests\TestCase;

class SectionServiceTest extends TestCase
{
    use RefreshDatabase;

    private SectionGroup $group;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->group = SectionGroup::create(['name' => 'Group A']);
    }

    private function dto(array $data): SectionDTO
    {
        $dto = Mockery::mock(SectionDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    public function test_list_delegates(): void
    {
        $repo = Mockery::mock(SectionRepository::class);
        $paginator = new LengthAwarePaginator([], 0, 10);
        $repo->shouldReceive('ListSections')->once()->andReturn($paginator);
        $service = new SectionService($repo);
        $this->assertSame($paginator, $service->listSections([]));
    }

    public function test_store_creates_section_and_dispatches_event(): void
    {
        Event::fake([SectionEvent::class]);
        $service = app(SectionService::class);

        $section = $service->storeSection($this->dto(['name' => 'Chem', 'section_group_id' => $this->group->id]));

        $this->assertDatabaseHas('sections', ['name' => 'Chem']);
        Event::assertDispatched(SectionEvent::class);
    }

    public function test_update_modifies_section_and_dispatches_event(): void
    {
        Event::fake([SectionEvent::class]);
        $section = Section::create(['name' => 'Old', 'section_group_id' => $this->group->id]);
        $service = app(SectionService::class);

        $updated = $service->updateSection($section, $this->dto(['name' => 'New', 'section_group_id' => $this->group->id]));

        $this->assertSame('New', $updated->name);
        Event::assertDispatched(SectionEvent::class);
    }

    public function test_delete_removes_section_without_dependencies(): void
    {
        Event::fake([SectionEvent::class]);
        $section = Section::create(['name' => 'Temp', 'section_group_id' => $this->group->id]);
        $service = app(SectionService::class);

        $service->deleteSection($section);

        $this->assertDatabaseMissing('sections', ['id' => $section->id]);
        Event::assertDispatched(SectionEvent::class);
    }

    public function test_delete_throws_when_section_in_use(): void
    {
        $repo = Mockery::mock(SectionRepository::class);
        $statesRel = Mockery::mock(HasMany::class);
        $statesRel->shouldReceive('exists')->andReturn(true);

        $section = Mockery::mock(Section::class)->makePartial();
        $section->shouldReceive('toArray')->andReturn(['id' => 1]);
        $section->shouldReceive('acceptanceItemStates')->andReturn($statesRel);

        $repo->shouldNotReceive('deleteSection');
        $service = new SectionService($repo);

        $this->expectException(Exception::class);
        $service->deleteSection($section);
    }

    public function test_get_accessible_sections_builds_group_tree(): void
    {
        // Allow all gate checks so the section is included in the tree.
        Gate::before(fn () => true);

        Section::create(['name' => 'Hematology', 'section_group_id' => $this->group->id]);
        $service = app(SectionService::class);

        $tree = $service->getAccessibleSections();

        $this->assertNotEmpty($tree);
        $this->assertSame('Group A', $tree[0]['title']);
        $this->assertSame('Hematology', $tree[0]['child'][0]['title']);
    }
}
