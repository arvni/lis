<?php

declare(strict_types=1);

namespace Tests\Feature\System;

use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RemoveAttendanceAndPayrollLeftoversMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_leave_workflows_and_hr_permissions_go_and_everything_else_stays(): void
    {
        $leaveId = DB::table('workflow_templates')->insertGetId(['name' => 'Staff leave', 'request_type' => 'LEAVE', 'priority' => 0]);
        DB::table('workflow_steps')->insert(['workflow_template_id' => $leaveId, 'name' => 'Manager', 'sort_order' => 0]);
        $purchase = WorkflowTemplate::create(['name' => 'Purchases', 'request_type' => 'PURCHASE']);

        $role = Role::findOrCreate('Supervisor', 'web');
        foreach (['Attendance', 'Attendance.Shifts.List Shifts', 'Payroll.Salary Slips.Issue Salary Slips', 'Inventory.Items.List Items'] as $name) {
            $role->givePermissionTo(Permission::findOrCreate($name, 'web'));
        }
        $user = User::factory()->create();
        $user->givePermissionTo('Payroll.Salary Slips.Issue Salary Slips');

        (require database_path('migrations/2026_10_07_000001_remove_attendance_and_payroll_leftovers.php'))->up();

        $this->assertDatabaseMissing('workflow_templates', ['id' => $leaveId]);
        $this->assertDatabaseMissing('workflow_steps', ['workflow_template_id' => $leaveId]);
        $this->assertModelExists($purchase);
        $this->assertSame(['Inventory.Items.List Items'], Permission::pluck('name')->all());
        $this->assertSame(['Inventory.Items.List Items'], $role->fresh()->permissions->pluck('name')->all());
        $this->assertCount(0, $user->fresh()->permissions);
    }
}
