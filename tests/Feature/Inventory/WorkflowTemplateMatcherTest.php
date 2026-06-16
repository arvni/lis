<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Services\WorkflowTemplateMatcher;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkflowTemplateMatcherTest extends TestCase
{
    use RefreshDatabase;

    private WorkflowTemplateMatcher $service;
    private User $requester;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new WorkflowTemplateMatcher();
        $this->requester = User::factory()->create();
    }

    private function template(array $attrs): WorkflowTemplate
    {
        return WorkflowTemplate::create(array_merge([
            'name'       => 'T' . uniqid(),
            'is_active'  => true,
            'is_default' => false,
            'conditions' => [],
            'priority'   => 100,
        ], $attrs));
    }

    public function test_returns_null_when_no_templates(): void
    {
        $this->assertNull($this->service->find($this->requester, 'normal'));
    }

    public function test_falls_back_to_default_when_no_conditional_matches(): void
    {
        $default = $this->template(['is_default' => true]);
        $matched = $this->service->find($this->requester, 'normal');
        $this->assertSame($default->id, $matched->id);
    }

    public function test_matches_template_by_urgency(): void
    {
        $this->template(['is_default' => true]);
        $urgent = $this->template(['conditions' => ['urgencies' => ['urgent']], 'priority' => 1]);

        $matched = $this->service->find($this->requester, 'urgent');
        $this->assertSame($urgent->id, $matched->id);
    }

    public function test_does_not_match_when_urgency_differs(): void
    {
        $default = $this->template(['is_default' => true]);
        $this->template(['conditions' => ['urgencies' => ['urgent']], 'priority' => 1]);

        $matched = $this->service->find($this->requester, 'normal');
        $this->assertSame($default->id, $matched->id);
    }

    public function test_matches_template_by_min_total(): void
    {
        $this->template(['is_default' => true]);
        $highValue = $this->template(['conditions' => ['min_total' => 500], 'priority' => 1]);

        $this->assertSame($highValue->id, $this->service->find($this->requester, 'normal', 800)->id);
        // Below threshold → default.
        $this->assertTrue($this->service->find($this->requester, 'normal', 100)->is_default);
    }

    public function test_empty_conditions_non_default_never_matches(): void
    {
        $default = $this->template(['is_default' => true]);
        $this->template(['conditions' => [], 'priority' => 1]); // no conditions, not default

        $this->assertSame($default->id, $this->service->find($this->requester, 'normal')->id);
    }

    public function test_lower_priority_value_wins(): void
    {
        $this->template(['is_default' => true]);
        $this->template(['conditions' => ['urgencies' => ['urgent']], 'priority' => 5]);
        $first = $this->template(['conditions' => ['urgencies' => ['urgent']], 'priority' => 1]);

        $this->assertSame($first->id, $this->service->find($this->requester, 'urgent')->id);
    }
}
