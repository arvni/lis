<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Enums\ReportApprovalStatus;
use App\Domains\Reception\Events\ReportPublishedEvent;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Services\ReportApprovalService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * HTTP-level coverage of the report lifecycle: store, update, approve,
 * reject, publish and unpublish (quality-audit item 6). The approval-flow
 * mechanics themselves are covered in ReportApprovalFlowTest.
 */
class ReportLifecycleEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private Patient $patient;

    private Acceptance $acceptance;

    private AcceptanceItem $acceptanceItem;

    private ReportTemplate $template;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake();

        $registrar = User::factory()->create();

        $this->patient = Patient::create([
            'fullName' => 'Lifecycle Patient',
            'idNo' => 'RLE'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => $registrar->id,
        ]);

        $this->acceptance = Acceptance::create([
            'status' => AcceptanceStatus::PROCESSING,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => $registrar->id,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);

        $this->acceptanceItem = AcceptanceItem::create([
            'acceptance_id' => $this->acceptance->id,
            'method_test_id' => $this->makeMethodTestId(),
            'price' => 100,
            'discount' => 0,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);

        $this->template = ReportTemplate::create(['name' => 'Lifecycle Template']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function userWithPermissions(string ...$permissions): User
    {
        $user = User::factory()->create();
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function makeMethodTestId(): int
    {
        $test = Test::create([
            'name' => 'Test '.Str::random(4),
            'fullName' => 'Lifecycle Test',
            'code' => 'T'.uniqid(),
            'type' => TestType::TEST,
            'status' => true,
            'can_merge' => false,
        ]);
        $method = Method::create([
            'name' => 'Method '.Str::random(4),
            'price' => 0,
            'turnaround_time' => 1,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);

        return (int) MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ])->id;
    }

    /**
     * A stored document with a real (faked) file behind it — the
     * DocumentUpdateListener only persists a retag when the physical
     * file can be moved to its new address.
     */
    private function makeDocument(DocumentTag $tag = DocumentTag::TEMP): Document
    {
        $hash = Str::random(32);
        $path = "documents/$hash.pdf";
        Storage::put($path, 'pdf-content');

        return Document::create([
            'hash' => $hash,
            'ext' => 'pdf',
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'tag' => $tag,
            'originalName' => 'file.pdf',
            'path' => $path,
        ]);
    }

    private function makeReport(User $reporter, array $attributes = []): Report
    {
        return Report::create(array_merge([
            'acceptance_item_id' => $this->acceptanceItem->id,
            'report_template_id' => $this->template->id,
            'reporter_id' => $reporter->id,
            'reported_at' => now(),
            'status' => true,
        ], $attributes));
    }

    private function timelineMessages(): array
    {
        return array_values($this->acceptanceItem->fresh()->timeline ?? []);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Store
    // ─────────────────────────────────────────────────────────────────────────

    public function test_store_creates_report_with_signer_and_links_reported_document(): void
    {
        $user = $this->userWithPermissions('Report.Create Report');
        $this->actingAs($user);
        $document = $this->makeDocument();

        $response = $this->post(route('reports.store'), [
            'acceptance_item_id' => $this->acceptanceItem->id,
            'report_template_id' => $this->template->id,
            'patient_id' => $this->patient->id,
            'reported_document' => ['id' => $document->hash],
        ]);

        $report = Report::sole();
        $response->assertRedirect(route('reports.show', $report));

        $this->assertSame($user->id, $report->reporter_id);
        $this->assertSame($this->acceptanceItem->id, $report->acceptance_item_id);
        $this->assertSame($this->template->id, $report->report_template_id);
        $this->assertTrue($report->signers()->where('user_id', $user->id)->exists());

        // The synchronous DocumentUpdateListener retags the uploaded document.
        $document->refresh();
        $this->assertSame(DocumentTag::REPORTED, $document->tag);
        $this->assertSame('report', $document->related_type);
        $this->assertSame($report->id, $document->related_id);

        $this->assertContains("Report Created By $user->name", $this->timelineMessages());
    }

    public function test_store_requires_create_report_permission(): void
    {
        $this->actingAs(User::factory()->create());
        $document = $this->makeDocument();

        $this->post(route('reports.store'), [
            'acceptance_item_id' => $this->acceptanceItem->id,
            'report_template_id' => $this->template->id,
            'patient_id' => $this->patient->id,
            'reported_document' => ['id' => $document->hash],
        ])->assertForbidden();

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAs($this->userWithPermissions('Report.Create Report'));

        $this->post(route('reports.store'), [])
            ->assertSessionHasErrors(['acceptance_item_id', 'report_template_id', 'patient_id', 'reported_document']);

        $this->assertDatabaseCount('reports', 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update
    // ─────────────────────────────────────────────────────────────────────────

    public function test_update_resets_approvals_and_replaces_signers(): void
    {
        Notification::fake();

        $flow = ApprovalFlow::create(['name' => 'Two-step flow', 'active' => true]);
        $flow->steps()->createMany([
            ['position' => 1, 'name' => 'Technical review'],
            ['position' => 2, 'name' => 'Final sign-off'],
        ]);
        $this->template->update(['approval_flow_id' => $flow->id]);

        $reporter = User::factory()->create();
        $report = $this->makeReport($reporter);

        $stepApprover = $this->userWithPermissions('Report.Approve Report');
        app(ReportApprovalService::class)->approve($report, $stepApprover);
        $this->assertSame(1, $report->approvals()->count());

        $editor = $this->userWithPermissions('Report.Edit Report');
        $this->actingAs($editor);
        $document = $this->makeDocument();
        $signerUser = User::factory()->create();

        $response = $this->put(route('reports.update', $report), [
            'acceptance_item_id' => $this->acceptanceItem->id,
            'report_template_id' => $this->template->id,
            'reported_document' => ['id' => $document->hash],
            'signers' => [
                ['user_id' => $signerUser->id, 'title' => 'Consultant', 'row' => 1],
            ],
        ]);

        $response->assertRedirect(route('reports.show', $report));

        $report->refresh();
        $this->assertSame(0, $report->approvals()->count());
        $this->assertSame(ReportApprovalStatus::PENDING, $report->approval_status);
        $this->assertNull($report->current_step_position);
        $this->assertSame($editor->id, $report->reporter_id);

        $signers = $report->signers()->get();
        $this->assertCount(1, $signers);
        $this->assertSame($signerUser->id, $signers->first()->user_id);
        $this->assertSame('Consultant', $signers->first()->title);

        $this->assertContains("Report Updated By $editor->name", $this->timelineMessages());
    }

    public function test_update_requires_edit_report_permission(): void
    {
        $reporter = User::factory()->create();
        $report = $this->makeReport($reporter);
        $document = $this->makeDocument();

        $this->actingAs(User::factory()->create());

        $this->put(route('reports.update', $report), [
            'acceptance_item_id' => $this->acceptanceItem->id,
            'report_template_id' => $this->template->id,
            'reported_document' => ['id' => $document->hash],
        ])->assertForbidden();

        $this->assertSame($reporter->id, $report->fresh()->reporter_id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Approve / Reject
    // ─────────────────────────────────────────────────────────────────────────

    public function test_approve_endpoint_approves_report_and_stores_published_document(): void
    {
        $reporter = User::factory()->create();
        $report = $this->makeReport($reporter);
        $approver = $this->userWithPermissions('Report.Approve Report');
        $this->actingAs($approver);
        $document = $this->makeDocument();

        $response = $this->put(route('reports.approve', $report), [
            'published_report_document' => ['hash' => $document->hash],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', true);

        $report->refresh();
        $this->assertSame($approver->id, $report->approver_id);
        $this->assertNotNull($report->approved_at);
        $this->assertSame(ReportApprovalStatus::APPROVED, $report->approval_status);
        $this->assertTrue($report->signers()->where('user_id', $approver->id)->exists());

        $document->refresh();
        $this->assertSame(DocumentTag::PUBLISHED, $document->tag);
        $this->assertSame($report->id, $document->related_id);

        $this->assertContains("Report Approved By $approver->name", $this->timelineMessages());
    }

    public function test_approve_endpoint_blocks_already_approved_report(): void
    {
        $reporter = User::factory()->create();
        $previousApprover = User::factory()->create();
        $report = $this->makeReport($reporter, [
            'approver_id' => $previousApprover->id,
            'approved_at' => now(),
        ]);

        $this->actingAs($this->userWithPermissions('Report.Approve Report'));

        $this->put(route('reports.approve', $report), [
            'published_report_document' => ['hash' => $this->makeDocument()->hash],
        ])->assertSessionHasErrors();

        $this->assertSame($previousApprover->id, $report->fresh()->approver_id);
    }

    public function test_approve_endpoint_requires_approve_permission(): void
    {
        $report = $this->makeReport(User::factory()->create());

        $this->actingAs(User::factory()->create());

        $this->put(route('reports.approve', $report), [
            'published_report_document' => ['hash' => $this->makeDocument()->hash],
        ])->assertForbidden();

        $this->assertNull($report->fresh()->approver_id);
    }

    public function test_reject_endpoint_marks_report_rejected(): void
    {
        Notification::fake();

        $reporter = User::factory()->create();
        $report = $this->makeReport($reporter);
        $rejecter = $this->userWithPermissions('Report.Approve Report');
        $this->actingAs($rejecter);

        $response = $this->put(route('reports.reject', $report), [
            'comment' => 'values out of range',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', true);

        $report->refresh();
        $this->assertFalse($report->status);
        $this->assertSame('values out of range', $report->comment);
        $this->assertSame(ReportApprovalStatus::REJECTED, $report->approval_status);

        $this->assertContains("Report Rejected By $rejecter->name", $this->timelineMessages());
    }

    public function test_reject_endpoint_requires_a_comment(): void
    {
        $report = $this->makeReport(User::factory()->create());
        $this->actingAs($this->userWithPermissions('Report.Approve Report'));

        $this->put(route('reports.reject', $report), [])
            ->assertSessionHasErrors('comment');

        $this->assertTrue($report->fresh()->status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Publish
    // ─────────────────────────────────────────────────────────────────────────

    public function test_publish_endpoint_publishes_approved_report(): void
    {
        Event::fake([ReportPublishedEvent::class]);

        $approver = User::factory()->create();
        $report = $this->makeReport(User::factory()->create(), [
            'approver_id' => $approver->id,
            'approved_at' => now(),
        ]);

        $publisher = $this->userWithPermissions('Report.Edit Report');
        $this->actingAs($publisher);

        $response = $this->put(route('reports.publish', $report));

        $response->assertRedirect();
        $response->assertSessionHas('success', true);

        $report->refresh();
        $this->assertSame($publisher->id, $report->publisher_id);
        $this->assertNotNull($report->published_at);

        Event::assertDispatched(ReportPublishedEvent::class,
            fn (ReportPublishedEvent $event) => $event->acceptance->id === $this->acceptance->id
                && $event->silent === false);

        $this->assertContains("Report Published By $publisher->name", $this->timelineMessages());
    }

    public function test_publish_endpoint_can_publish_silently(): void
    {
        Event::fake([ReportPublishedEvent::class]);

        $report = $this->makeReport(User::factory()->create(), [
            'approver_id' => User::factory()->create()->id,
            'approved_at' => now(),
        ]);

        $this->actingAs($this->userWithPermissions('Report.Edit Report'));

        $this->put(route('reports.publish', $report), ['silently_publish' => true])
            ->assertSessionHas('success', true);

        Event::assertDispatched(ReportPublishedEvent::class,
            fn (ReportPublishedEvent $event) => $event->silent === true);
    }

    public function test_publish_endpoint_blocks_unapproved_report(): void
    {
        Event::fake([ReportPublishedEvent::class]);

        $report = $this->makeReport(User::factory()->create());
        $this->actingAs($this->userWithPermissions('Report.Edit Report'));

        $this->put(route('reports.publish', $report))->assertSessionHasErrors();

        $this->assertNull($report->fresh()->publisher_id);
        Event::assertNotDispatched(ReportPublishedEvent::class);
    }

    public function test_publish_endpoint_blocks_rejected_report(): void
    {
        Event::fake([ReportPublishedEvent::class]);

        $report = $this->makeReport(User::factory()->create(), [
            'status' => false,
            'approver_id' => User::factory()->create()->id,
        ]);
        $this->actingAs($this->userWithPermissions('Report.Edit Report'));

        $this->put(route('reports.publish', $report))->assertSessionHasErrors();

        $this->assertNull($report->fresh()->publisher_id);
        Event::assertNotDispatched(ReportPublishedEvent::class);
    }

    public function test_publish_endpoint_blocks_double_publish(): void
    {
        Event::fake([ReportPublishedEvent::class]);

        $firstPublisher = User::factory()->create();
        $report = $this->makeReport(User::factory()->create(), [
            'approver_id' => User::factory()->create()->id,
            'approved_at' => now(),
            'publisher_id' => $firstPublisher->id,
            'published_at' => now(),
        ]);
        $this->actingAs($this->userWithPermissions('Report.Edit Report'));

        $this->put(route('reports.publish', $report))->assertSessionHasErrors();

        $this->assertSame($firstPublisher->id, $report->fresh()->publisher_id);
        Event::assertNotDispatched(ReportPublishedEvent::class);
    }

    public function test_publish_endpoint_requires_edit_report_permission(): void
    {
        $report = $this->makeReport(User::factory()->create(), [
            'approver_id' => User::factory()->create()->id,
            'approved_at' => now(),
        ]);

        $this->actingAs(User::factory()->create());

        $this->put(route('reports.publish', $report))->assertForbidden();

        $this->assertNull($report->fresh()->publisher_id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Unpublish
    // ─────────────────────────────────────────────────────────────────────────

    public function test_unpublish_endpoint_clears_publication_and_deletes_published_document(): void
    {
        $report = $this->makeReport(User::factory()->create(), [
            'approver_id' => User::factory()->create()->id,
            'approved_at' => now(),
            'publisher_id' => User::factory()->create()->id,
            'published_at' => now(),
        ]);
        $publishedDocument = $this->makeDocument(DocumentTag::PUBLISHED);
        $publishedDocument->update(['related_type' => 'report', 'related_id' => $report->id]);

        $user = $this->userWithPermissions('Report.Unpublish Report');
        $this->actingAs($user);

        $this->put(route('reports.unpublish', $report))->assertOk();

        $report->refresh();
        $this->assertNull($report->publisher_id);
        $this->assertNull($report->published_at);

        $this->assertSoftDeleted('documents', ['hash' => $publishedDocument->hash]);

        $this->assertContains("Report Unpublished By $user->name", $this->timelineMessages());
    }

    public function test_unpublish_endpoint_blocks_report_that_is_not_published(): void
    {
        $report = $this->makeReport(User::factory()->create(), [
            'approver_id' => User::factory()->create()->id,
            'approved_at' => now(),
        ]);

        $this->actingAs($this->userWithPermissions('Report.Unpublish Report'));

        $this->put(route('reports.unpublish', $report))->assertSessionHasErrors();
    }

    public function test_unpublish_endpoint_requires_unpublish_permission(): void
    {
        $publisher = User::factory()->create();
        $report = $this->makeReport(User::factory()->create(), [
            'approver_id' => User::factory()->create()->id,
            'approved_at' => now(),
            'publisher_id' => $publisher->id,
            'published_at' => now(),
        ]);

        $this->actingAs(User::factory()->create());

        $this->put(route('reports.unpublish', $report))->assertForbidden();

        $this->assertSame($publisher->id, $report->fresh()->publisher_id);
    }
}
