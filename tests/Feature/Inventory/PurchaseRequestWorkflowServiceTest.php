<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\PurchaseRequestApproval;
use App\Domains\Inventory\Models\WorkflowStep;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Notifications\PurchaseRequestApprovedNotification;
use App\Domains\Inventory\Notifications\PurchaseRequestRejectedNotification;
use App\Domains\Inventory\Services\PurchaseRequestWorkflowService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Tests\TestCase;

class PurchaseRequestWorkflowServiceTest extends TestCase
{
    use RefreshDatabase;

    private PurchaseRequestWorkflowService $service;
    private User $requester;
    private User $approver;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->service = new PurchaseRequestWorkflowService();
        $this->requester = User::factory()->create(['name' => 'Requester']);
        $this->approver = User::factory()->create(['name' => 'Approver']);
        $this->actingAs($this->approver);
    }

    /** Build a template with N steps, each approved by $this->approver. */
    private function makeTemplate(int $steps = 1): WorkflowTemplate
    {
        $template = WorkflowTemplate::create(['name' => 'WF']);
        for ($i = 1; $i <= $steps; $i++) {
            WorkflowStep::create([
                'workflow_template_id' => $template->id,
                'name'                 => "Step $i",
                'sort_order'           => $i,
                'approver_user_id'     => $this->approver->id,
            ]);
        }
        return $template;
    }

    private function makePr(WorkflowTemplate $template, ?string $status = null): PurchaseRequest
    {
        return PurchaseRequest::create([
            'requested_by_user_id' => $this->requester->id,
            'urgency'              => 'normal',
            'status'               => $status ?? PurchaseRequestStatus::SUBMITTED->value,
            'notes'                => 'PR',
            'workflow_template_id' => $template->id,
        ]);
    }

    // ── initiate ─────────────────────────────────────────────────────────────────

    public function test_initiate_creates_pending_approvals_for_each_step(): void
    {
        $template = $this->makeTemplate(2);
        $pr = $this->makePr($template);

        $this->service->initiate($pr);

        $this->assertSame(2, $pr->approvals()->count());
        $this->assertSame(2, $pr->approvals()->where('status', ApprovalStatus::PENDING->value)->count());
    }

    public function test_initiate_no_op_without_template(): void
    {
        $pr = PurchaseRequest::create([
            'requested_by_user_id' => $this->requester->id,
            'urgency'              => 'normal',
            'status'               => PurchaseRequestStatus::SUBMITTED->value,
            'workflow_template_id' => null,
        ]);

        $this->service->initiate($pr);
        $this->assertSame(0, $pr->approvals()->count());
    }

    // ── getActiveApproval / canAct ───────────────────────────────────────────────

    public function test_get_active_approval_returns_lowest_sort_order_pending(): void
    {
        $template = $this->makeTemplate(2);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);

        $active = $this->service->getActiveApproval($pr);
        $this->assertSame('Step 1', $active->step->name);
    }

    public function test_can_act_true_for_step_approver(): void
    {
        $template = $this->makeTemplate(1);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);

        $this->assertTrue($this->service->canAct($pr, $this->approver));
        $this->assertFalse($this->service->canAct($pr, $this->requester));
    }

    public function test_can_act_false_when_no_active_step(): void
    {
        $template = $this->makeTemplate(1);
        $pr = $this->makePr($template);
        // no initiate → no approvals
        $this->assertFalse($this->service->canAct($pr, $this->approver));
    }

    // ── delegate ─────────────────────────────────────────────────────────────────

    public function test_delegate_assigns_step_to_delegatee(): void
    {
        $template = $this->makeTemplate(1);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);
        $delegatee = User::factory()->create();

        $this->service->delegate($pr, $this->approver, $delegatee->id);

        $this->assertSame($delegatee->id, $this->service->getActiveApproval($pr)->delegated_to_user_id);
        $this->assertTrue($this->service->canAct($pr, $delegatee));
    }

    public function test_delegate_throws_when_actor_not_approver(): void
    {
        $template = $this->makeTemplate(1);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);

        $this->expectException(RuntimeException::class);
        $this->service->delegate($pr, $this->requester, User::factory()->create()->id);
    }

    // ── approveStep ──────────────────────────────────────────────────────────────

    public function test_approve_single_step_marks_pr_approved_and_notifies_requester(): void
    {
        $template = $this->makeTemplate(1);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);

        $this->service->approveStep($pr, $this->approver, 'looks good');

        $this->assertSame(PurchaseRequestStatus::APPROVED, $pr->fresh()->status);
        Notification::assertSentTo($this->requester, PurchaseRequestApprovedNotification::class);
    }

    public function test_approve_first_of_two_steps_advances_to_next(): void
    {
        $template = $this->makeTemplate(2);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);

        $this->service->approveStep($pr, $this->approver);

        $this->assertNotSame(PurchaseRequestStatus::APPROVED, $pr->fresh()->status);
        $this->assertSame('Step 2', $this->service->getActiveApproval($pr)->step->name);
    }

    public function test_approve_throws_when_unauthorised(): void
    {
        $template = $this->makeTemplate(1);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);

        $this->expectException(RuntimeException::class);
        $this->service->approveStep($pr, $this->requester);
    }

    // ── rejectStep ───────────────────────────────────────────────────────────────

    public function test_reject_sets_pr_draft_and_rejects_remaining_steps(): void
    {
        $template = $this->makeTemplate(2);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);

        $this->service->rejectStep($pr, $this->approver, 'budget exceeded');

        $this->assertSame(PurchaseRequestStatus::DRAFT, $pr->fresh()->status);
        $this->assertSame(0, $pr->approvals()->where('status', ApprovalStatus::PENDING->value)->count());
        Notification::assertSentTo($this->requester, PurchaseRequestRejectedNotification::class);
    }

    // ── recall ───────────────────────────────────────────────────────────────────

    public function test_recall_returns_pr_to_draft_when_untouched(): void
    {
        $template = $this->makeTemplate(1);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);

        $this->service->recall($pr, $this->requester);

        $this->assertSame(PurchaseRequestStatus::DRAFT, $pr->fresh()->status);
        $this->assertSame(0, $pr->approvals()->count());
    }

    public function test_recall_throws_when_not_submitted(): void
    {
        $template = $this->makeTemplate(1);
        $pr = $this->makePr($template, PurchaseRequestStatus::DRAFT->value);

        $this->expectException(RuntimeException::class);
        $this->service->recall($pr, $this->requester);
    }

    public function test_recall_throws_when_not_requester(): void
    {
        $template = $this->makeTemplate(1);
        $pr = $this->makePr($template);

        $this->expectException(RuntimeException::class);
        $this->service->recall($pr, $this->approver);
    }

    public function test_recall_throws_when_a_step_already_acted(): void
    {
        $template = $this->makeTemplate(2);
        $pr = $this->makePr($template);
        $this->service->initiate($pr);
        // Approve the first step, then re-submit so recall's status guard passes.
        $this->service->approveStep($pr, $this->approver);
        $pr->update(['status' => PurchaseRequestStatus::SUBMITTED->value]);

        $this->expectException(RuntimeException::class);
        $this->service->recall($pr->fresh(), $this->requester);
    }
}
