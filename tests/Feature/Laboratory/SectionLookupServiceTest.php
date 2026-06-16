<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Services\SectionLookupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SectionLookupServiceTest extends TestCase
{
    use RefreshDatabase;

    private SectionLookupService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SectionLookupService();
    }

    public function test_get_section_names_keyed_by_id(): void
    {
        $group = SectionGroup::create(['name' => 'G']);
        $section = Section::create(['name' => 'Hematology', 'section_group_id' => $group->id]);

        $names = $this->service->getSectionNames();

        $this->assertSame('Hematology', $names[$section->id]);
    }

    public function test_get_section_group_names_keyed_by_id(): void
    {
        $group = SectionGroup::create(['name' => 'Chemistry Group']);

        $names = $this->service->getSectionGroupNames();

        $this->assertSame('Chemistry Group', $names[$group->id]);
    }

    public function test_get_section_names_empty_when_none(): void
    {
        $this->assertCount(0, $this->service->getSectionNames());
    }
}
