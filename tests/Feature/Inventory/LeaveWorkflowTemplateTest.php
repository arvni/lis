<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\WorkflowRequestType;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Services\WorkflowTemplateMatcher;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Leave workflows live with the other workflow templates but are kept apart from purchasing:
 * untyped templates stay for purchase and export requests, and leave matches on roles only.
 */
class LeaveWorkflowTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchase_and_export_templates_are_never_used_for_leave(): void
    {
        $staff = $this->userWithRole('Lab Staff');
        $this->template(['name' => 'Staff purchases', 'conditions' => ['requester_roles' => ['Lab Staff']], 'priority' => 1]);
        $this->template(['name' => 'Fallback', 'is_default' => true, 'priority' => 9]);

        $this->assertNull((new WorkflowTemplateMatcher)->find($staff, '', 0, WorkflowRequestType::LEAVE));
    }

    public function test_leave_templates_are_picked_by_role_and_never_used_for_purchases(): void
    {
        $staff = $this->userWithRole('Lab Staff');
        $other = User::factory()->create();
        $byRole = $this->template([
            'request_type' => WorkflowRequestType::LEAVE,
            'conditions' => ['requester_roles' => ['Lab Staff']],
            'priority' => 1,
        ]);
        $default = $this->template(['request_type' => WorkflowRequestType::LEAVE, 'is_default' => true, 'priority' => 2]);
        $matcher = new WorkflowTemplateMatcher;

        $this->assertSame($byRole->id, $matcher->find($staff, '', 0, WorkflowRequestType::LEAVE)?->id);
        $this->assertSame($default->id, $matcher->find($other, '', 0, WorkflowRequestType::LEAVE)?->id);
        $this->assertNull($matcher->find($staff, 'NORMAL', 0, WorkflowRequestType::PURCHASE));
    }

    public function test_a_saved_leave_template_matches_on_roles_only(): void
    {
        $admin = User::factory()->create();
        Permission::findOrCreate('Inventory.WorkflowTemplates.Manage Workflow Templates');
        $admin->givePermissionTo('Inventory.WorkflowTemplates.Manage Workflow Templates');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->actingAs($admin)
            ->post(route('inventory.workflow-templates.store'), [
                'name' => 'Lab staff leave',
                'is_active' => true,
                'is_default' => false,
                'request_type' => 'LEAVE',
                'priority' => 0,
                'conditions' => ['urgencies' => ['URGENT'], 'requester_roles' => ['Lab Staff'], 'min_total' => 100],
                'steps' => [['name' => 'Supervisor review', 'sort_order' => 0, 'approver_role' => 'Lab Supervisor']],
            ])
            ->assertSessionHasNoErrors();

        $template = WorkflowTemplate::query()->sole();
        $this->assertSame(WorkflowRequestType::LEAVE, $template->request_type);
        $this->assertSame(['urgencies' => [], 'requester_roles' => ['Lab Staff'], 'min_total' => null], $template->conditions);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function template(array $attributes): WorkflowTemplate
    {
        return WorkflowTemplate::create(array_merge([
            'name' => 'T'.uniqid(),
            'is_active' => true,
            'is_default' => false,
            'request_type' => null,
            'conditions' => [],
            'priority' => 100,
        ], $attributes));
    }

    private function userWithRole(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate($role, 'web'));

        return $user;
    }
}
