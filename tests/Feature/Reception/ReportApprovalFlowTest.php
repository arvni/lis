<?php

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\Laboratory\Models\ApprovalFlowStep;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Enums\ReportApprovalAction;
use App\Domains\Reception\Enums\ReportApprovalStatus;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Notifications\ReportRejected;
use App\Domains\Reception\Notifications\ReportStepApprovalRequested;
use App\Domains\Reception\Services\ReportApprovalService;
use App\Domains\Reception\Services\ReportService;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ReportApprovalFlowTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function makeApprover(?Role $role = null, array $attributes = []): User
    {
        Permission::findOrCreate('Report.Approve Report');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user = User::factory()->create($attributes);
        $user->givePermissionTo('Report.Approve Report');

        if ($role) {
            $user->assignRole($role);
        }

        return $user;
    }

    /**
     * Two-step flow: step 1 bound to $stepOneRole (or unbound), step 2 unbound.
     */
    private function makeTwoStepFlow(?Role $stepOneRole = null, bool $allowSelfApproval = false): ApprovalFlow
    {
        $flow = ApprovalFlow::create([
            'name' => 'Two-step flow',
            'active' => true,
        ]);

        $flow->steps()->createMany([
            [
                'position' => 1,
                'name' => 'Technical review',
                'role_id' => $stepOneRole?->id,
                'allow_self_approval' => $allowSelfApproval,
            ],
            [
                'position' => 2,
                'name' => 'Final sign-off',
                'allow_self_approval' => $allowSelfApproval,
            ],
        ]);

        return $flow;
    }

    /**
     * Acceptance → AcceptanceItem → Report chain, with the report's template
     * optionally bound to an approval flow.
     *
     * @return array{Report, AcceptanceItem, ReportTemplate, User}
     */
    private function makeReport(?ApprovalFlow $flow = null): array
    {
        $reporter = User::factory()->create();

        $patient = Patient::create([
            'registrar_id' => $reporter->id,
            'fullName' => 'Approval Flow Patient',
            'idNo' => 'RAF' . uniqid(),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
        ]);

        $acceptance = Acceptance::create([
            'acceptor_id' => $reporter->id,
            'patient_id' => $patient->id,
            'status' => AcceptanceStatus::PROCESSING,
            'step' => 5,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);

        $item = AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $this->getMethodTestId(),
            'price' => 100,
            'discount' => 0,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);

        $template = ReportTemplate::create([
            'name' => 'Template',
            'approval_flow_id' => $flow?->id,
        ]);

        $report = Report::create([
            'acceptance_item_id' => $item->id,
            'report_template_id' => $template->id,
            'reporter_id' => $reporter->id,
            'reported_at' => now(),
            'status' => true,
        ]);

        return [$report, $item, $template, $reporter];
    }

    /**
     * Return a valid method_test_id, creating the minimal supporting chain
     * (section_group → section → test → method → method_test) if needed.
     */
    private function getMethodTestId(): int
    {
        $existing = DB::table('method_tests')->first();
        if ($existing) {
            return (int)$existing->id;
        }

        $testId = DB::table('tests')->insertGetId([
            'name' => 'Test RA',
            'code' => 'RA1',
            'fullName' => 'Test RA',
            'type' => 'TEST',
            'status' => 1,
            'can_merge' => 0,
            'price_type' => 'Fix',
            'price' => 100,
            'referrer_price_type' => 'Fix',
            'referrer_price' => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $methodId = DB::table('methods')->insertGetId([
            'name' => 'Method RA',
            'turnaround_time' => 1,
            'price' => 100,
            'referrer_price' => 100,
            'price_type' => 'Fix',
            'referrer_price_type' => 'Fix',
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('method_tests')->insertGetId([
            'test_id' => $testId,
            'method_id' => $methodId,
            'is_default' => 1,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Legacy behavior: no flow on the template
    // ─────────────────────────────────────────────────────────────────────────

    public function test_report_without_flow_is_approved_in_a_single_step(): void
    {
        Event::fake([PatientDocumentUpdateEvent::class]);

        [$report] = $this->makeReport();
        $approver = $this->makeApprover();

        $this->assertTrue(Gate::forUser($approver)->allows('approve', $report));

        $report = app(ReportApprovalService::class)->approve(
            $report,
            $approver,
            ['hash' => 'published-doc-hash']
        );

        $this->assertSame(ReportApprovalStatus::APPROVED, $report->approval_status);
        $this->assertSame($approver->id, $report->approver_id);
        $this->assertNotNull($report->approved_at);
        $this->assertCount(1, $report->approvals);
        $this->assertTrue($report->signers()->where('user_id', $approver->id)->exists());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multi-step flow
    // ─────────────────────────────────────────────────────────────────────────

    public function test_intermediate_step_records_approval_and_advances_flow(): void
    {
        $flow = $this->makeTwoStepFlow();
        [$report] = $this->makeReport($flow);
        $approver = $this->makeApprover();

        $report = app(ReportApprovalService::class)->approve($report, $approver, null, null, 'looks good');

        $this->assertSame(ReportApprovalStatus::IN_APPROVAL, $report->approval_status);
        $this->assertSame(2, $report->current_step_position);
        // Legacy columns untouched until the final step
        $this->assertNull($report->approver_id);
        $this->assertNull($report->approved_at);

        $approval = $report->approvals->first();
        $this->assertSame(ReportApprovalAction::APPROVED, $approval->action);
        $this->assertSame('looks good', $approval->comment);
        $this->assertSame('Technical review', $approval->step->name);
    }

    public function test_final_step_completes_flow_and_sets_legacy_approver_columns(): void
    {
        Event::fake([PatientDocumentUpdateEvent::class]);

        $flow = $this->makeTwoStepFlow();
        [$report] = $this->makeReport($flow);
        $first = $this->makeApprover();
        $second = $this->makeApprover();

        $service = app(ReportApprovalService::class);
        $report = $service->approve($report, $first);
        $report = $service->approve($report, $second, ['hash' => 'published-doc-hash']);

        $this->assertSame(ReportApprovalStatus::APPROVED, $report->approval_status);
        $this->assertNull($report->current_step_position);
        $this->assertSame($second->id, $report->approver_id);
        $this->assertNotNull($report->approved_at);
        $this->assertCount(2, $report->approvals);
    }

    public function test_rejection_at_any_step_ends_the_flow(): void
    {
        $flow = $this->makeTwoStepFlow();
        [$report] = $this->makeReport($flow);
        $approver = $this->makeApprover();

        $report = app(ReportApprovalService::class)->reject($report, $approver, 'wrong values');

        $this->assertSame(ReportApprovalStatus::REJECTED, $report->approval_status);
        $this->assertFalse($report->status);
        $this->assertSame('wrong values', $report->comment);
        $this->assertSame(ReportApprovalAction::REJECTED, $report->approvals->first()->action);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Policy rules
    // ─────────────────────────────────────────────────────────────────────────

    public function test_policy_blocks_reporter_self_approval_on_flow_step(): void
    {
        $flow = $this->makeTwoStepFlow();
        [$report, , , $reporter] = $this->makeReport($flow);

        Permission::findOrCreate('Report.Approve Report');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $reporter->givePermissionTo('Report.Approve Report');

        $this->assertFalse(Gate::forUser($reporter)->allows('approve', $report));
    }

    public function test_policy_blocks_user_from_approving_two_steps(): void
    {
        $flow = $this->makeTwoStepFlow();
        [$report] = $this->makeReport($flow);
        $approver = $this->makeApprover();

        $this->assertTrue(Gate::forUser($approver)->allows('approve', $report));

        $report = app(ReportApprovalService::class)->approve($report, $approver);

        $this->assertFalse(Gate::forUser($approver)->allows('approve', $report->fresh()));
    }

    public function test_policy_enforces_step_role_binding(): void
    {
        $role = Role::create(['name' => 'Lab Director', 'guard_name' => 'web']);
        $flow = $this->makeTwoStepFlow($role);
        [$report] = $this->makeReport($flow);

        $withoutRole = $this->makeApprover();
        $withRole = $this->makeApprover($role);

        $this->assertFalse(Gate::forUser($withoutRole)->allows('approve', $report));
        $this->assertTrue(Gate::forUser($withRole)->allows('approve', $report));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Editing resets the flow
    // ─────────────────────────────────────────────────────────────────────────

    public function test_editing_a_report_resets_collected_approvals(): void
    {
        Event::fake([PatientDocumentUpdateEvent::class]);

        $flow = $this->makeTwoStepFlow();
        [$report, $item, $template, $reporter] = $this->makeReport($flow);
        $approver = $this->makeApprover();

        $report = app(ReportApprovalService::class)->approve($report, $approver);
        $this->assertSame(ReportApprovalStatus::IN_APPROVAL, $report->approval_status);

        $report = app(ReportService::class)->updateReport(
            $report,
            $reporter,
            $item->id,
            $template->id,
            ['id' => 'reported-doc-hash']
        );

        $this->assertSame(ReportApprovalStatus::PENDING, $report->approval_status);
        $this->assertNull($report->current_step_position);
        $this->assertCount(0, $report->approvals()->get());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Notifications
    // ─────────────────────────────────────────────────────────────────────────

    public function test_intermediate_approval_notifies_eligible_next_step_users(): void
    {
        Notification::fake();

        $role = Role::create(['name' => 'Final Signer', 'guard_name' => 'web']);
        $flow = ApprovalFlow::create(['name' => 'Notify flow', 'active' => true]);
        $flow->steps()->createMany([
            ['position' => 1, 'name' => 'Technical review'],
            ['position' => 2, 'name' => 'Final sign-off', 'role_id' => $role->id],
        ]);

        [$report, , , $reporter] = $this->makeReport($flow);
        $stepOneApprover = $this->makeApprover();
        $finalSigner = $this->makeApprover($role);
        // Reporter holds the role too but must not be notified (self-approval blocked)
        Permission::findOrCreate('Report.Approve Report');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $reporter->givePermissionTo('Report.Approve Report');
        $reporter->assignRole($role);

        app(ReportApprovalService::class)->approve($report, $stepOneApprover);

        Notification::assertSentTo($finalSigner, ReportStepApprovalRequested::class,
            fn($notification) => $notification->report->id === $report->id
                && $notification->step->name === 'Final sign-off');
        Notification::assertNotSentTo($reporter, ReportStepApprovalRequested::class);
        Notification::assertNotSentTo($stepOneApprover, ReportStepApprovalRequested::class);
    }

    public function test_rejection_notifies_the_reporter(): void
    {
        Notification::fake();

        $flow = $this->makeTwoStepFlow();
        [$report, , , $reporter] = $this->makeReport($flow);
        $approver = $this->makeApprover();

        app(ReportApprovalService::class)->reject($report, $approver, 'wrong values');

        Notification::assertSentTo($reporter, ReportRejected::class,
            fn($notification) => $notification->report->id === $report->id
                && $notification->comment === 'wrong values'
                && $notification->rejecter->id === $approver->id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Approving worklist visibility
    // ─────────────────────────────────────────────────────────────────────────

    public function test_approvable_by_scope_only_matches_reports_actionable_by_user(): void
    {
        $role = Role::create(['name' => 'Senior Reviewer', 'guard_name' => 'web']);
        $flow = $this->makeTwoStepFlow($role);

        [$legacyReport] = $this->makeReport();
        [$flowReport, , , $flowReporter] = $this->makeReport($flow);

        $withRole = $this->makeApprover($role);
        $withoutRole = $this->makeApprover();

        // Legacy reports stay visible to anyone; the role-bound step 1 only to role holders.
        $this->assertEqualsCanonicalizing(
            [$legacyReport->id, $flowReport->id],
            Report::approvableBy($withRole)->pluck('id')->all()
        );
        $this->assertEqualsCanonicalizing(
            [$legacyReport->id],
            Report::approvableBy($withoutRole)->pluck('id')->all()
        );

        // The reporter never sees their own flow report (no self-approval).
        Permission::findOrCreate('Report.Approve Report');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $flowReporter->givePermissionTo('Report.Approve Report');
        $flowReporter->assignRole($role);
        $this->assertEqualsCanonicalizing(
            [$legacyReport->id],
            Report::approvableBy($flowReporter)->pluck('id')->all()
        );

        // After step 1, the unbound step 2 is visible to others but not to
        // the user who already approved step 1.
        app(ReportApprovalService::class)->approve($flowReport, $withRole);

        $this->assertEqualsCanonicalizing(
            [$legacyReport->id, $flowReport->id],
            Report::approvableBy($withoutRole)->pluck('id')->all()
        );
        $this->assertEqualsCanonicalizing(
            [$legacyReport->id],
            Report::approvableBy($withRole)->pluck('id')->all()
        );
    }
}
