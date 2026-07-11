<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Enums\ReportApprovalStatus;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Services\ReportApprovalService;
use App\Domains\Reception\Services\ReportService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use RuntimeException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Pins the DB::transaction guarantees of ReportService's multi-write flows
 * (quality-audit item 1): a failure part-way through create/update/approve
 * must leave no partial writes — in particular, updateReport deletes all
 * approvals first and must restore them when the edit fails.
 */
class ReportServiceTransactionTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Acceptance → AcceptanceItem chain plus a report template,
     * optionally bound to an approval flow.
     *
     * @return array{AcceptanceItem, ReportTemplate, User}
     */
    private function makeAcceptanceItem(?ApprovalFlow $flow = null): array
    {
        $reporter = User::factory()->create();

        $patient = Patient::create([
            'registrar_id' => $reporter->id,
            'fullName' => 'Transaction Test Patient',
            'idNo' => 'RTX'.uniqid(),
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

        return [$item, $template, $reporter];
    }

    private function makeReportFor(AcceptanceItem $item, ReportTemplate $template, User $reporter): Report
    {
        return Report::create([
            'acceptance_item_id' => $item->id,
            'report_template_id' => $template->id,
            'reporter_id' => $reporter->id,
            'reported_at' => now(),
            'status' => true,
        ]);
    }

    private function makeApprover(): User
    {
        Permission::findOrCreate('Report.Approve Report');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user = User::factory()->create();
        $user->givePermissionTo('Report.Approve Report');

        return $user;
    }

    /**
     * Make the next PatientDocumentUpdateEvent dispatch blow up, simulating a
     * failure on the last write of the flow (the reported/published document).
     */
    private function failOnDocumentEvent(): void
    {
        Event::listen(PatientDocumentUpdateEvent::class, function (): void {
            throw new RuntimeException('document processing failed');
        });
    }

    /**
     * Return a valid method_test_id, creating the minimal supporting chain
     * (test → method → method_test) if needed.
     */
    private function getMethodTestId(): int
    {
        $existing = DB::table('method_tests')->first();
        if ($existing) {
            return (int) $existing->id;
        }

        $testId = DB::table('tests')->insertGetId([
            'name' => 'Test RTX',
            'code' => 'RTX1',
            'fullName' => 'Test RTX',
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
            'name' => 'Method RTX',
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
    // createReport
    // ─────────────────────────────────────────────────────────────────────────

    public function test_create_report_persists_report_signer_and_timeline(): void
    {
        Event::fake([PatientDocumentUpdateEvent::class]);

        [$item, $template, $reporter] = $this->makeAcceptanceItem();

        $report = app(ReportService::class)->createReport(
            $reporter,
            $item->id,
            $template->id,
            ['id' => 'reported-doc-hash']
        );

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'acceptance_item_id' => $item->id,
            'reporter_id' => $reporter->id,
        ]);
        $this->assertTrue($report->signers()->where('user_id', $reporter->id)->exists());
        $this->assertStringContainsString(
            "Report Created By $reporter->name",
            json_encode($item->fresh()->timeline)
        );
        Event::assertDispatched(PatientDocumentUpdateEvent::class);
    }

    public function test_create_report_rolls_back_everything_when_document_step_fails(): void
    {
        [$item, $template, $reporter] = $this->makeAcceptanceItem();
        $this->failOnDocumentEvent();

        try {
            app(ReportService::class)->createReport(
                $reporter,
                $item->id,
                $template->id,
                ['id' => 'reported-doc-hash']
            );
            $this->fail('createReport should have thrown');
        } catch (RuntimeException) {
            // expected
        }

        $this->assertDatabaseCount('reports', 0);
        $this->assertDatabaseCount('signers', 0);
        $this->assertSame([], $item->fresh()->timeline);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // updateReport — a failed edit must not wipe collected approvals
    // ─────────────────────────────────────────────────────────────────────────

    public function test_update_report_restores_approvals_when_the_edit_fails(): void
    {
        $flow = ApprovalFlow::create(['name' => 'Two-step flow', 'active' => true]);
        $flow->steps()->createMany([
            ['position' => 1, 'name' => 'Technical review'],
            ['position' => 2, 'name' => 'Final sign-off'],
        ]);

        [$item, $template, $reporter] = $this->makeAcceptanceItem($flow);
        $report = $this->makeReportFor($item, $template, $reporter);
        $approver = $this->makeApprover();

        $report = app(ReportApprovalService::class)->approve($report, $approver);
        $this->assertSame(ReportApprovalStatus::IN_APPROVAL, $report->approval_status);
        $this->assertCount(1, $report->approvals);

        $this->failOnDocumentEvent();

        try {
            app(ReportService::class)->updateReport(
                $report,
                $reporter,
                $item->id,
                $template->id,
                ['id' => 'reported-doc-hash']
            );
            $this->fail('updateReport should have thrown');
        } catch (RuntimeException) {
            // expected
        }

        $report = $report->fresh();
        $this->assertCount(1, $report->approvals()->get());
        $this->assertSame(ReportApprovalStatus::IN_APPROVAL, $report->approval_status);
        $this->assertSame(2, $report->current_step_position);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // approveReport
    // ─────────────────────────────────────────────────────────────────────────

    public function test_approve_report_rolls_back_when_published_document_fails(): void
    {
        [$item, $template, $reporter] = $this->makeAcceptanceItem();
        $report = $this->makeReportFor($item, $template, $reporter);
        $approver = $this->makeApprover();

        $this->failOnDocumentEvent();

        try {
            app(ReportService::class)->approveReport(
                $report,
                $approver,
                ['hash' => 'published-doc-hash']
            );
            $this->fail('approveReport should have thrown');
        } catch (RuntimeException) {
            // expected
        }

        $report = $report->fresh();
        $this->assertNull($report->approver_id);
        $this->assertNull($report->approved_at);
        $this->assertFalse($report->signers()->where('user_id', $approver->id)->exists());
        $this->assertSame([], $item->fresh()->timeline);
    }
}
