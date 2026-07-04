<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestApproval;
use App\Domains\Inventory\Models\WorkflowStep;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Notifications\PurchaseRequestOverdueNotification;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Regression test for improvement-plan #13: the escalate command resolved a step's
 * approver role with Role::findByName(), which THROWS when the role does not exist.
 * Because the whole foreach is wrapped in a try/catch, one bad role name aborted the
 * entire escalation batch (command returned FAILURE, remaining steps unprocessed).
 * The fix queries for the role (null when missing) so unknown roles skip gracefully.
 */
class EscalateOverduePurchaseRequestStepsTest extends TestCase
{
    use RefreshDatabase;

    private function overdueApprovalWithRole(?string $roleName): PurchaseRequestApproval
    {
        $requester = User::factory()->create();
        $pr        = PurchaseRequest::create([
            "requested_by_user_id" => $requester->id,
            "status"               => "SUBMITTED",
        ]);

        $template = WorkflowTemplate::create(["name" => "Standard"]);
        $step     = WorkflowStep::create([
            "workflow_template_id" => $template->id,
            "name"                 => "Manager Approval",
            "sort_order"           => 1,
            "approver_role"        => $roleName,
        ]);

        $approval = PurchaseRequestApproval::create([
            "purchase_request_id" => $pr->id,
            "workflow_step_id"    => $step->id,
            "status"              => "PENDING",
        ]);
        // due_at / escalated are not mass-assignable — set directly.
        $approval->due_at    = now()->subDays(2);
        $approval->escalated = false;
        $approval->save();

        return $approval;
    }

    public function test_unknown_approver_role_does_not_abort_the_batch(): void
    {
        Notification::fake();
        Role::create(["name" => "Store Manager", "guard_name" => "web"]);

        // Step points at a role that does not exist.
        $approval = $this->overdueApprovalWithRole("GhostRole");

        // Before the fix Role::findByName() threw → command returned FAILURE (1).
        $this->artisan("inventory:escalate-overdue-pr-steps")
            ->assertExitCode(0);

        // 'escalated' is not mass-assignable — the old update([...]) silently
        // dropped it; the direct assignment now persists the flag.
        $this->assertTrue($approval->fresh()->escalated);
    }

    public function test_existing_approver_role_still_notifies_its_users(): void
    {
        Notification::fake();
        Role::create(["name" => "Store Manager", "guard_name" => "web"]);
        $buyer = Role::create(["name" => "Buyer", "guard_name" => "web"]);

        $approver = User::factory()->create();
        $approver->assignRole($buyer);

        $this->overdueApprovalWithRole("Buyer");

        $this->artisan("inventory:escalate-overdue-pr-steps")
            ->assertExitCode(0);

        Notification::assertSentTo($approver, PurchaseRequestOverdueNotification::class);
    }
}
