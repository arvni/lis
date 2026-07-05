<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\WorkflowStep;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Services\PurchaseRequestWorkflowService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Pins plan item #18: the PurchaseRequest workflow/financial actions now authorize at the
 * policy layer (PurchaseRequestApprovalPolicy + granular financial abilities) instead of the
 * misleading `viewAny` gate. A non-approver must get a 403 from the policy — NOT a 302
 * redirect-with-error produced by catching the service's defense-in-depth RuntimeException.
 */
class PurchaseRequestAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $requester;
    private User $approver;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->requester = User::factory()->create(['name' => 'Requester']);
        $this->approver  = User::factory()->create(['name' => 'Approver']);
    }

    private function grant(User $user, string $permission): void
    {
        Permission::findOrCreate($permission, 'web');
        $user->givePermissionTo($permission);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /** A SUBMITTED PR with one pending approval step owned by $this->approver. */
    private function submittedPrWithStep(): PurchaseRequest
    {
        $template = WorkflowTemplate::create(['name' => 'WF']);
        WorkflowStep::create([
            'workflow_template_id' => $template->id,
            'name'                 => 'Step 1',
            'sort_order'           => 1,
            'approver_user_id'     => $this->approver->id,
        ]);

        $pr = PurchaseRequest::create([
            'requested_by_user_id' => $this->requester->id,
            'urgency'              => 'normal',
            'status'               => PurchaseRequestStatus::SUBMITTED->value,
            'notes'                => 'PR',
            'workflow_template_id' => $template->id,
        ]);

        app(PurchaseRequestWorkflowService::class)->initiate($pr);

        return $pr;
    }

    // ── approve-step ─────────────────────────────────────────────────────────────

    public function test_approve_step_forbidden_for_non_approver(): void
    {
        $pr = $this->submittedPrWithStep();
        // Even a user holding the coarse approve permission is NOT the step approver.
        $outsider = User::factory()->create();
        $this->grant($outsider, 'Inventory.PurchaseRequests.Approve Purchase Request');

        $this->actingAs($outsider)
            ->post(route('inventory.purchase-requests.approve-step', $pr))
            ->assertForbidden();

        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $pr->fresh()->status);
    }

    public function test_approve_step_allowed_for_step_approver(): void
    {
        $pr = $this->submittedPrWithStep();

        $this->actingAs($this->approver)
            ->post(route('inventory.purchase-requests.approve-step', $pr), ['notes' => 'ok'])
            ->assertRedirect();

        $this->assertSame(PurchaseRequestStatus::APPROVED, $pr->fresh()->status);
    }

    // ── reject-step ──────────────────────────────────────────────────────────────

    public function test_reject_step_forbidden_for_non_approver(): void
    {
        $pr = $this->submittedPrWithStep();

        $this->actingAs($this->requester)
            ->post(route('inventory.purchase-requests.reject-step', $pr), ['notes' => 'no'])
            ->assertForbidden();
    }

    // ── recall ───────────────────────────────────────────────────────────────────

    public function test_recall_forbidden_for_non_requester(): void
    {
        $pr = $this->submittedPrWithStep();

        $this->actingAs($this->approver)
            ->post(route('inventory.purchase-requests.recall', $pr))
            ->assertForbidden();

        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $pr->fresh()->status);
    }

    public function test_recall_allowed_for_requester(): void
    {
        $pr = $this->submittedPrWithStep();

        $this->actingAs($this->requester)
            ->post(route('inventory.purchase-requests.recall', $pr))
            ->assertRedirect();

        $this->assertSame(PurchaseRequestStatus::DRAFT, $pr->fresh()->status);
    }

    // ── bulk-approve ─────────────────────────────────────────────────────────────

    public function test_bulk_approve_forbidden_without_approve_permission(): void
    {
        $pr = $this->submittedPrWithStep();

        $this->actingAs($this->requester)
            ->post(route('inventory.purchase-requests.bulk-approve'), ['ids' => [$pr->id]])
            ->assertForbidden();
    }

    // ── financial separation of duties ───────────────────────────────────────────

    public function test_pay_forbidden_without_pay_permission(): void
    {
        $pr = PurchaseRequest::create([
            'requested_by_user_id' => $this->requester->id,
            'urgency'              => 'normal',
            'status'               => PurchaseRequestStatus::ORDERED->value,
            'workflow_template_id' => null,
        ]);
        // Holding create/approve must NOT imply the ability to record payment.
        $this->grant($this->requester, 'Inventory.PurchaseRequests.Create Purchase Request');

        $this->actingAs($this->requester)
            ->post(route('inventory.purchase-requests.pay', $pr), ['payment_date' => '2026-07-05'])
            ->assertForbidden();
    }

    public function test_pay_allowed_with_pay_permission(): void
    {
        $pr = PurchaseRequest::create([
            'requested_by_user_id' => $this->requester->id,
            'urgency'              => 'normal',
            'status'               => PurchaseRequestStatus::ORDERED->value,
            'workflow_template_id' => null,
        ]);
        $this->grant($this->requester, 'Inventory.PurchaseRequests.Pay Purchase Request');

        // Clearing the gate is what we assert — anything but 403 proves the policy passed.
        $response = $this->actingAs($this->requester)
            ->post(route('inventory.purchase-requests.pay', $pr), ['payment_date' => '2026-07-05']);

        $this->assertNotSame(403, $response->baseResponse->getStatusCode());
    }
}
