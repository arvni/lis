<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\WorkflowStep;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Services\PurchaseRequestService;
use App\Domains\Inventory\Services\PurchaseRequestWorkflowService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Pins quality-audit item #8: bulkApproveSteps must surface WHY each request was
 * skipped (per-id reasons) instead of a bare counter, and must report() unexpected
 * throwables rather than swallowing them.
 */
class PurchaseRequestBulkApproveTest extends TestCase
{
    use RefreshDatabase;

    private User $approver;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->approver = User::factory()->create(['name' => 'Approver']);
    }

    /** A SUBMITTED PR whose single pending step is owned by $stepApprover. */
    private function submittedPrWithStep(User $stepApprover): PurchaseRequest
    {
        $template = WorkflowTemplate::create(['name' => 'WF '.uniqid()]);
        WorkflowStep::create([
            'workflow_template_id' => $template->id,
            'name' => 'Step 1',
            'sort_order' => 1,
            'approver_user_id' => $stepApprover->id,
        ]);

        $pr = PurchaseRequest::create([
            'requested_by_user_id' => User::factory()->create()->id,
            'urgency' => 'normal',
            'status' => PurchaseRequestStatus::SUBMITTED->value,
            'notes' => 'PR',
            'workflow_template_id' => $template->id,
        ]);

        app(PurchaseRequestWorkflowService::class)->initiate($pr);

        return $pr;
    }

    public function test_bulk_approve_returns_per_id_skip_reasons(): void
    {
        $this->actingAs($this->approver);
        $approvable = $this->submittedPrWithStep($this->approver);
        $notAuthorised = $this->submittedPrWithStep(User::factory()->create());
        // No workflow template → no approvals → no pending step to act on.
        $noPendingStep = PurchaseRequest::create([
            'requested_by_user_id' => User::factory()->create()->id,
            'urgency' => 'normal',
            'status' => PurchaseRequestStatus::SUBMITTED->value,
            'workflow_template_id' => null,
        ]);
        $missingId = 999999;

        $result = app(PurchaseRequestService::class)->bulkApproveSteps(
            [$approvable->id, $notAuthorised->id, $noPendingStep->id, $missingId],
            $this->approver,
        );

        $this->assertSame(1, $result['approved']);
        $this->assertSame([
            $notAuthorised->id => 'You are not authorised to approve this step.',
            $noPendingStep->id => 'No pending approval step found.',
            $missingId => 'Purchase request not found.',
        ], $result['skipped']);
        $this->assertSame(PurchaseRequestStatus::APPROVED, $approvable->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $notAuthorised->fresh()->status);
    }

    public function test_bulk_approve_reports_unexpected_throwables_with_generic_reason(): void
    {
        Exceptions::fake();
        $this->actingAs($this->approver);
        $pr = $this->submittedPrWithStep($this->approver);

        $this->mock(PurchaseRequestWorkflowService::class)
            ->shouldReceive('approveStep')
            ->once()
            ->andThrow(new \Exception('SQLSTATE[HY000]: connection lost'));

        $result = app(PurchaseRequestService::class)->bulkApproveSteps([$pr->id], $this->approver);

        $this->assertSame(0, $result['approved']);
        // Internal detail must not leak to the user, but the exception must be reported.
        $this->assertSame([$pr->id => 'Unexpected error.'], $result['skipped']);
        Exceptions::assertReported(\Exception::class);
    }

    public function test_bulk_approve_endpoint_flashes_skip_reasons(): void
    {
        Permission::findOrCreate('Inventory.PurchaseRequests.Approve Purchase Request', 'web');
        $this->approver->givePermissionTo('Inventory.PurchaseRequests.Approve Purchase Request');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $approvable = $this->submittedPrWithStep($this->approver);
        $notAuthorised = $this->submittedPrWithStep(User::factory()->create());

        $this->actingAs($this->approver)
            ->post(route('inventory.purchase-requests.bulk-approve'), [
                'ids' => [$approvable->id, $notAuthorised->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('status', 'Approved 1 step(s). 1 skipped — '
                ."#{$notAuthorised->id}: You are not authorised to approve this step.");

        $this->assertSame(PurchaseRequestStatus::APPROVED, $approvable->fresh()->status);
    }
}
