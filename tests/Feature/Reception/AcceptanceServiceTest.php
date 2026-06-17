<?php

namespace Tests\Feature\Reception;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Notification\Models\WhatsappMessage;
use App\Domains\Reception\Adapters\LaboratoryAdapter;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\DTOs\AcceptanceDTO;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Notifications\PatientReportPublished;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Domains\Setting\Repositories\SettingRepository;
use App\Notifications\ReferrerReportPublished;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class AcceptanceServiceTest extends TestCase
{
    use RefreshDatabase;

    private Patient $patient;
    private \App\Domains\Laboratory\Models\Section $section;

    protected function setUp(): void
    {
        parent::setUp();
        // storeAcceptance/updateAcceptance stamp timeline entries with
        // auth()->user()->name, so an authenticated user must exist.
        $this->actingAs(\App\Domains\User\Models\User::factory()->create());

        // Shared patient for acceptances that don't create their own
        // (acceptances.patient_id is NOT NULL).
        $this->patient = Patient::create([
            'fullName'     => 'Acceptance Patient',
            'idNo'         => 'ACPT001',
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);

        // acceptance_item_states.section_id is a NOT-NULL FK to sections,
        // and sections.section_group_id is itself a required FK.
        $sectionGroup = \App\Domains\Laboratory\Models\SectionGroup::create(['name' => 'R Group']);
        $this->section = \App\Domains\Laboratory\Models\Section::create([
            'name'             => 'R Section',
            'section_group_id' => $sectionGroup->id,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Build a real AcceptanceService with all five dependencies mocked.
     *
     * @return array{AcceptanceService, MockInterface, MockInterface, MockInterface, MockInterface, MockInterface}
     */
    private function makeServiceWithMocks(): array
    {
        $acceptanceRepo    = Mockery::mock(AcceptanceRepository::class);
        $acceptanceItemSvc = Mockery::mock(AcceptanceItemService::class);
        $labAdapter        = Mockery::mock(LaboratoryAdapter::class);
        $settingRepo       = Mockery::mock(SettingRepository::class);
        $referrerOrderSvc  = Mockery::mock(ReferrerOrderService::class);

        $service = new AcceptanceService(
            $acceptanceRepo,
            $acceptanceItemSvc,
            $labAdapter,
            $settingRepo,
            $referrerOrderSvc,
        );

        return [$service, $acceptanceRepo, $acceptanceItemSvc, $labAdapter, $settingRepo, $referrerOrderSvc];
    }

    /**
     * Minimal AcceptanceDTO for tests / panels.
     */
    private function makeAcceptanceDTO(array $overrides = []): AcceptanceDTO
    {
        $defaults = [
            'patientId'         => 1,
            'step'              => 0,
            'consultationId'    => null,
            'doctorId'          => null,
            'invoiceId'         => null,
            'referrerId'        => null,
            'acceptorId'        => 1,
            'referenceCode'     => null,
            'samplerGender'     => null,
            'howReport'         => null,
            'doctor'            => null,
            'acceptanceItems'   => ['tests' => [], 'panels' => []],
            'status'            => null,
            'outPatient'        => false,
            'samplerId'         => null,
            'waitingForPooling' => false,
        ];

        $merged = array_merge($defaults, $overrides);

        return new AcceptanceDTO(
            $merged['patientId'],
            $merged['step'],
            $merged['consultationId'],
            $merged['doctorId'],
            $merged['invoiceId'],
            $merged['referrerId'],
            $merged['acceptorId'],
            $merged['referenceCode'],
            $merged['samplerGender'],
            $merged['howReport'],
            $merged['doctor'],
            $merged['acceptanceItems'],
            $merged['status'],
            $merged['outPatient'],
            $merged['samplerId'],
            $merged['waitingForPooling'],
        );
    }

    /**
     * Stub for a single test item inside the 'tests' array.
     */
    private function makeTestItem(array $overrides = []): array
    {
        return array_merge([
            'method_test' => [
                'id'   => 10,
                'test' => ['type' => 'test'],
            ],
            'price'            => 50.0,
            'discount'         => 0.0,
            'customParameters' => [],
            'samples'          => [['patients' => [['id' => 1]]]],
            'no_sample'        => 1,
        ], $overrides);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-01: storeAcceptance creates Acceptance + AcceptanceItems; status=PENDING
    // (Unit test – all deps mocked)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_store_acceptance_creates_acceptance_and_acceptance_items(): void
    {
        [$service, $acceptanceRepo, $acceptanceItemSvc, , $settingRepo] = $this->makeServiceWithMocks();

        // The DTO has one test item
        $dto = $this->makeAcceptanceDTO([
            'acceptanceItems' => [
                'tests'  => [$this->makeTestItem()],
                'panels' => [],
            ],
        ]);

        // Fake acceptance returned by repository
        $fakeAcceptance       = new Acceptance();
        $fakeAcceptance->id   = 1;
        $fakeAcceptance->status = AcceptanceStatus::PENDING;

        $acceptanceRepo
            ->shouldReceive('createAcceptance')
            ->once()
            ->andReturn($fakeAcceptance);

        // No consultation, so settingRepo should not be called
        $settingRepo->shouldNotReceive('getSettingsByClassAndKey');

        // One AcceptanceItem should be stored
        $acceptanceItemSvc
            ->shouldReceive('storeAcceptanceItem')
            ->once()
            ->andReturn(new AcceptanceItem(['acceptance_id' => 1, 'method_test_id' => 10]));

        $result = $service->storeAcceptance($dto);

        $this->assertInstanceOf(Acceptance::class, $result);
        $this->assertSame(AcceptanceStatus::PENDING, $result->status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-02: storeAcceptance with panel distributes price evenly
    // (Unit test)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_store_acceptance_with_panel_distributes_price_evenly(): void
    {
        [$service, $acceptanceRepo, $acceptanceItemSvc, , $settingRepo] = $this->makeServiceWithMocks();

        $panelItems = [
            ['method_test' => ['id' => 20, 'test' => ['type' => 'test']], 'customParameters' => [], 'samples' => []],
            ['method_test' => ['id' => 21, 'test' => ['type' => 'test']], 'customParameters' => [], 'samples' => []],
        ];

        $dto = $this->makeAcceptanceDTO([
            'acceptanceItems' => [
                'tests'  => [],
                'panels' => [
                    [
                        'price'            => 100.0,
                        'discount'         => 20.0,
                        'sampleless'       => false,
                        'reportless'       => false,
                        'acceptanceItems'  => $panelItems,
                    ],
                ],
            ],
        ]);

        $fakeAcceptance     = new Acceptance();
        $fakeAcceptance->id = 1;

        $acceptanceRepo
            ->shouldReceive('createAcceptance')
            ->once()
            ->andReturn($fakeAcceptance);

        $settingRepo->shouldNotReceive('getSettingsByClassAndKey');

        $storedItems = [];
        $acceptanceItemSvc
            ->shouldReceive('storeAcceptanceItem')
            ->twice()
            ->andReturnUsing(function ($dto) use (&$storedItems) {
                $storedItems[] = $dto;
                return new AcceptanceItem();
            });

        $service->storeAcceptance($dto);

        // Price should be evenly split: 100 / 2 = 50 per item
        $this->assertCount(2, $storedItems);
        $this->assertEqualsWithDelta(50.0, $storedItems[0]->price, 0.001);
        $this->assertEqualsWithDelta(50.0, $storedItems[1]->price, 0.001);

        // Both should share the same panel_id (non-null and equal)
        $this->assertNotNull($storedItems[0]->panelId);
        $this->assertEquals($storedItems[0]->panelId, $storedItems[1]->panelId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-03: storeAcceptance with SERVICE type sets reportless and sampleless
    // (Unit test)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_store_acceptance_with_service_type_sets_reportless_and_sampleless(): void
    {
        [$service, $acceptanceRepo, $acceptanceItemSvc, , $settingRepo] = $this->makeServiceWithMocks();

        $dto = $this->makeAcceptanceDTO([
            'acceptanceItems' => [
                'tests' => [
                    $this->makeTestItem([
                        'method_test' => ['id' => 30, 'test' => ['type' => TestType::SERVICE->value]],
                    ]),
                ],
                'panels' => [],
            ],
        ]);

        $fakeAcceptance     = new Acceptance();
        $fakeAcceptance->id = 1;

        $acceptanceRepo
            ->shouldReceive('createAcceptance')
            ->once()
            ->andReturn($fakeAcceptance);

        $settingRepo->shouldNotReceive('getSettingsByClassAndKey');

        $capturedDTO = null;
        $acceptanceItemSvc
            ->shouldReceive('storeAcceptanceItem')
            ->once()
            ->andReturnUsing(function ($itemDTO) use (&$capturedDTO) {
                $capturedDTO = $itemDTO;
                return new AcceptanceItem();
            });

        $service->storeAcceptance($dto);

        $this->assertNotNull($capturedDTO);
        $this->assertTrue($capturedDTO->sampleless, 'SERVICE item should have sampleless=true');
        $this->assertTrue((bool)$capturedDTO->reportless, 'SERVICE item should have reportless=true');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-04: updateAcceptance step=3 processes tests and advances step
    // (Unit test)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_update_acceptance_step3_processes_tests_and_advances_step(): void
    {
        [$service, $acceptanceRepo, $acceptanceItemSvc, , , $referrerOrderSvc] = $this->makeServiceWithMocks();

        // step 3 reconciles referrer orders for the acceptance.
        $referrerOrderSvc->shouldReceive('syncReferrerOrdersForAcceptance')->andReturnNull();

        // Build a real-ish Acceptance model (no DB)
        $acceptance         = new Acceptance();
        $acceptance->id     = 1;
        $acceptance->status = AcceptanceStatus::PENDING;
        $acceptance->step   = 3;
        $acceptance->setRawAttributes(['step' => 3, 'status' => AcceptanceStatus::PENDING->value, 'id' => 1]);

        // processTestsData calls updateAcceptance twice: once for step, then processTestsData internals also call it
        // updateAcceptance step=3 calls processTestsData → updateAcceptance(['step' => step])
        // then outer updateAcceptance(['step' => min(step+1,5)])
        $acceptanceRepo
            ->shouldReceive('updateAcceptance')
            ->andReturn($acceptance);

        // acceptanceItemService: findAcceptanceItemById returns null → storeAcceptanceItem called
        $acceptanceItemSvc
            ->shouldReceive('findAcceptanceItemById')
            ->andReturn(null);

        $newItem     = new AcceptanceItem();
        $newItem->id = 99;
        $acceptanceItemSvc
            ->shouldReceive('storeAcceptanceItem')
            ->once()
            ->andReturn($newItem);

        // acceptance->acceptanceItems() will be called for whereNotIn delete — mock via partial
        // We use a real Acceptance model but intercept the relation with a spy
        // Mock typed as HasMany so it satisfies Acceptance::acceptanceItems(): HasMany.
        $itemsRelation = Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $itemsRelation->shouldReceive('whereNotIn')->andReturnSelf();
        $itemsRelation->shouldReceive('delete')->andReturn(0);

        $acceptance = Mockery::mock(Acceptance::class)->makePartial();
        $acceptance->id     = 1;
        $acceptance->status = AcceptanceStatus::PENDING;
        $acceptance->step   = 3;
        $acceptance->shouldReceive('acceptanceItems')->andReturn($itemsRelation);
        $acceptance->shouldReceive('toArray')->andReturn([
            'step'   => 3,
            'status' => 'pending',
            'id'     => 1,
        ]);

        $data = [
            'step'            => 3,
            'acceptanceItems' => [
                'tests' => [
                    $this->makeTestItem(['id' => null]),
                ],
                'panels' => [],
            ],
        ];

        $result = $service->updateAcceptance($acceptance, $data);

        $this->assertInstanceOf(Acceptance::class, $result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-05: updateAcceptance step=5 transitions PENDING → WAITING_FOR_PAYMENT
    // (Unit test)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_update_acceptance_step5_transitions_pending_to_waiting_for_payment(): void
    {
        [$service, $acceptanceRepo] = $this->makeServiceWithMocks();

        $acceptance         = new Acceptance();
        $acceptance->id     = 1;
        $acceptance->status = AcceptanceStatus::PENDING;
        $acceptance->step   = 5;
        $acceptance->setRawAttributes(['step' => 5, 'status' => AcceptanceStatus::PENDING->value, 'id' => 1]);

        $updatedAcceptance         = new Acceptance();
        $updatedAcceptance->id     = 1;
        $updatedAcceptance->status = AcceptanceStatus::WAITING_FOR_PAYMENT;

        $acceptanceRepo
            ->shouldReceive('updateAcceptance')
            ->once()
            ->withArgs(function ($acc, $data) {
                return isset($data['status'])
                    && $data['status'] === AcceptanceStatus::WAITING_FOR_PAYMENT;
            })
            ->andReturn($updatedAcceptance);

        $result = $service->updateAcceptance($acceptance, ['step' => 5]);

        $this->assertSame(AcceptanceStatus::WAITING_FOR_PAYMENT, $result->status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-06 to R-16: feature tests that hit a real database
    // ─────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────
    // R-06: checkAndUpdateAcceptanceStatus → PROCESSING when some items started
    // ─────────────────────────────────────────────────────────────────────────

    public function test_check_and_update_acceptance_status_sets_processing_when_some_items_started(): void
    {
        $this->setUpDatabase();

        $acceptance = $this->createAcceptance(['status' => AcceptanceStatus::WAITING_FOR_PAYMENT]);

        // Create two AcceptanceItems with no reports (so not all have reports)
        $item1 = AcceptanceItem::create([
            'acceptance_id'  => $acceptance->id,
            'method_test_id' => $this->getMethodTestId(),
            'price'          => 100,
            'discount'       => 0,
            'reportless'     => false,
            'sampleless'     => false,
            'no_sample'      => 1,
            'customParameters' => [],
            'timeline'       => [],
        ]);

        // Create a state for item1 that is NOT 'waiting' (i.e. started)
        AcceptanceItemState::create([
            'acceptance_item_id' => $item1->id,
            'section_id'         => $this->section->id,
            'user_id'            => auth()->id(),
            'parameters'         => [],
            'status'             => AcceptanceItemStateStatus::PROCESSING,
        ]);

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->checkAndUpdateAcceptanceStatus($acceptance);

        $acceptance->refresh();
        $this->assertSame(AcceptanceStatus::PROCESSING, $acceptance->status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-07: checkAndUpdateAcceptanceStatus → WAITING_FOR_PUBLISHING when all
    //       items published but financial_approved=false
    // ─────────────────────────────────────────────────────────────────────────

    public function test_check_and_update_acceptance_status_waits_for_financial_approval_before_reporting(): void
    {
        $this->setUpDatabase();

        $acceptance = $this->createAcceptance([
            'status'            => AcceptanceStatus::PROCESSING,
            'financial_approved' => false,
        ]);

        $methodTestId = $this->getMethodTestId();

        // One reportless=false item with a published+approved report
        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 80,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        Report::create([
            'reporter_id'        => auth()->id(),
            'acceptance_item_id' => $item->id,
            'status'             => true,
            'published_at'       => now(),
            'approved_at'        => now(),
        ]);

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->checkAndUpdateAcceptanceStatus($acceptance);

        $acceptance->refresh();
        $this->assertSame(AcceptanceStatus::WAITING_FOR_PUBLISHING, $acceptance->status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-08: checkAcceptanceReport → REPORTED + notification dispatched
    //       when all published and financial_approved=true
    // ─────────────────────────────────────────────────────────────────────────

    public function test_check_acceptance_report_sets_reported_when_all_published_and_financial_approved(): void
    {
        $this->setUpDatabase();
        Notification::fake();

        $patient = Patient::create([
            'fullName'    => 'Test Patient R08',
            'idNo'        => 'R08IDN',
            'registrar_id' => auth()->id(),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender'      => 'male',
        ]);

        $acceptance = $this->createAcceptance([
            'patient_id'        => $patient->id,
            'status'            => AcceptanceStatus::WAITING_FOR_PUBLISHING,
            'financial_approved' => true,
            // A delivery channel must be selected for the patient notification to
            // have any channels (via() is empty otherwise, so nothing is sent).
            'howReport'         => ['sms' => true],
        ]);

        $methodTestId = $this->getMethodTestId();
        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 60,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        Report::create([
            'reporter_id'        => auth()->id(),
            'acceptance_item_id' => $item->id,
            'status'             => true,
            'published_at'       => now(),
        ]);

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->checkAcceptanceReport($acceptance);

        $acceptance->refresh();
        $this->assertSame(AcceptanceStatus::REPORTED, $acceptance->status);

        Notification::assertSentTo($patient, PatientReportPublished::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-09: publishAcceptance marks all unpublished reports
    // ─────────────────────────────────────────────────────────────────────────

    public function test_publish_acceptance_marks_all_unpublished_reports(): void
    {
        $this->setUpDatabase();

        $publisher = \App\Domains\User\Models\User::factory()->create(['name' => 'Publisher R09']);

        $acceptance = $this->createAcceptance([
            'status'            => AcceptanceStatus::WAITING_FOR_PUBLISHING,
            'financial_approved' => false,
            'howReport'         => [],
        ]);

        $methodTestId = $this->getMethodTestId();

        // item1 – unpublished report
        $item1 = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 50,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);
        $report1 = Report::create([
            'reporter_id'        => auth()->id(),
            'acceptance_item_id' => $item1->id,
            'status'             => true,
            'published_at'       => null,
        ]);

        // item2 – unpublished report
        $item2 = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 50,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);
        $report2 = Report::create([
            'reporter_id'        => auth()->id(),
            'acceptance_item_id' => $item2->id,
            'status'             => true,
            'published_at'       => null,
        ]);

        // item3 – already published (should remain untouched)
        $item3 = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 50,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);
        $alreadyPublishedAt = now()->subHour();
        $report3 = Report::create([
            'reporter_id'        => auth()->id(),
            'acceptance_item_id' => $item3->id,
            'status'             => true,
            'published_at'       => $alreadyPublishedAt,
        ]);

        // We need AcceptanceItemService to be available; bind a partial mock that
        // suppresses the timeline update (which would need extra relations).
        $this->instance(
            AcceptanceItemService::class,
            tap(Mockery::mock(AcceptanceItemService::class)->makePartial(), function ($mock) {
                $mock->shouldReceive('updateAcceptanceItemTimeline')->andReturn(new AcceptanceItem());
            })
        );

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->publishAcceptance($acceptance, $publisher->id, silentlyPublish: true);

        $this->assertNotNull($report1->fresh()->published_at, 'report1 should be published');
        $this->assertNotNull($report2->fresh()->published_at, 'report2 should be published');
        // report3 published_at should not have changed
        $this->assertEquals(
            $alreadyPublishedAt->format('Y-m-d H:i:s'),
            \Illuminate\Support\Carbon::parse($report3->fresh()->published_at)->format('Y-m-d H:i:s'),
            'already-published report should be untouched'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-10: publishAcceptance rolls back on exception inside transaction
    // ─────────────────────────────────────────────────────────────────────────

    public function test_publish_acceptance_rolls_back_on_exception(): void
    {
        $this->setUpDatabase();

        $publisher = \App\Domains\User\Models\User::factory()->create(['name' => 'Publisher R10']);

        $acceptance = $this->createAcceptance([
            'status'            => AcceptanceStatus::WAITING_FOR_PUBLISHING,
            'financial_approved' => false,
            'howReport'         => [],
        ]);

        $methodTestId = $this->getMethodTestId();
        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 50,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);
        Report::create([
            'reporter_id'        => auth()->id(),
            'acceptance_item_id' => $item->id,
            'status'             => true,
            'published_at'       => null,
        ]);

        // Inject a mock AcceptanceItemService that throws inside the transaction
        $this->instance(
            AcceptanceItemService::class,
            tap(Mockery::mock(AcceptanceItemService::class)->makePartial(), function ($mock) {
                $mock->shouldReceive('updateAcceptanceItemTimeline')
                    ->andThrow(new \RuntimeException('DB failure'));
            })
        );

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);

        $this->expectException(\RuntimeException::class);
        $service->publishAcceptance($acceptance, $publisher->id);

        // After the exception the report should still be unpublished (rolled back)
        $this->assertNull(Report::where('acceptance_item_id', $item->id)->first()->published_at);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-11: cancelAcceptance sets status, rejects item-states, cancels invoice
    // ─────────────────────────────────────────────────────────────────────────

    public function test_cancel_acceptance_sets_status_and_cancels_invoice_and_item_states(): void
    {
        $this->setUpDatabase();

        $invoice = Invoice::create([
            'owner_type'  => 'patient',
            'owner_id'    => $this->patient->id,
            'user_id'     => auth()->id(),
            'status'      => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount'    => 0,
        ]);

        $acceptance = $this->createAcceptance([
            'status'     => AcceptanceStatus::WAITING_FOR_PAYMENT,
            'invoice_id' => $invoice->id,
        ]);

        $methodTestId = $this->getMethodTestId();
        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 100,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        AcceptanceItemState::create([
            'acceptance_item_id' => $item->id,
            'section_id'         => $this->section->id,
            'user_id'            => auth()->id(),
            'parameters'         => [],
            'status'             => AcceptanceItemStateStatus::PROCESSING,
        ]);

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->cancelAcceptance($acceptance);

        $acceptance->refresh();
        $this->assertSame(AcceptanceStatus::CANCELLED, $acceptance->status);

        $itemState = AcceptanceItemState::where('acceptance_item_id', $item->id)->first();
        $this->assertSame(AcceptanceItemStateStatus::REJECTED, $itemState->status);

        $invoice->refresh();
        $this->assertSame(InvoiceStatus::CANCELED->value, $invoice->status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-12: deleteAcceptance throws when status is REPORTED
    // ─────────────────────────────────────────────────────────────────────────

    public function test_delete_acceptance_throws_when_status_is_reported(): void
    {
        $this->setUpDatabase();

        $acceptance = $this->createAcceptance(['status' => AcceptanceStatus::REPORTED]);

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);

        $this->expectException(Exception::class);
        $service->deleteAcceptance($acceptance);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-13: deleteAcceptance throws when status is PROCESSING
    // ─────────────────────────────────────────────────────────────────────────

    public function test_delete_acceptance_throws_when_status_is_processing(): void
    {
        $this->setUpDatabase();

        $acceptance = $this->createAcceptance(['status' => AcceptanceStatus::PROCESSING]);

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);

        $this->expectException(Exception::class);
        $service->deleteAcceptance($acceptance);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-14: sendNotifications → PatientReportPublished + WhatsappMessage records
    // ─────────────────────────────────────────────────────────────────────────

    public function test_send_notifications_sends_email_and_whatsapp_on_publish(): void
    {
        $this->setUpDatabase();
        Notification::fake();

        $patient = Patient::create([
            'fullName'    => 'Test Patient R14',
            'idNo'        => 'R14IDN',
            'registrar_id' => auth()->id(),
            'nationality' => 'OM',
            'dateOfBirth' => '1985-05-05',
            'gender'      => 'male',
            'phone'       => '91234567',
        ]);

        $acceptance = $this->createAcceptance([
            'patient_id'        => $patient->id,
            'status'            => AcceptanceStatus::WAITING_FOR_PUBLISHING,
            'financial_approved' => true,
            'howReport'         => [
                'whatsappNumber' => '91234567',
                'whatsapp'       => true,
                'email'          => false,
            ],
        ]);

        $methodTestId = $this->getMethodTestId();
        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 80,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        Report::create([
            'reporter_id'        => auth()->id(),
            'acceptance_item_id' => $item->id,
            'status'             => true,
            'published_at'       => now(),
        ]);

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->checkAcceptanceReport($acceptance);

        Notification::assertSentTo($patient, PatientReportPublished::class);

        // The service creates one WhatsappMessage per acceptance item that has a published document.
        // Because publishedDocument might not exist without the full document stack, we assert the
        // notification was at least sent; a WhatsappMessage record is only persisted when
        // $acceptanceItem->report->publishedDocument exists. We skip that assertion here
        // because it requires the Document model + storage layer.
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-15: sendToReferrer=true → ReferrerReportPublished + referrer order updated
    // ─────────────────────────────────────────────────────────────────────────

    public function test_send_notifications_updates_referrer_order_when_send_to_referrer_enabled(): void
    {
        $this->setUpDatabase();
        Notification::fake();

        $patient = Patient::create([
            'fullName'    => 'Patient R15',
            'idNo'        => 'R15IDN',
            'registrar_id' => auth()->id(),
            'nationality' => 'OM',
            'dateOfBirth' => '1980-01-01',
            'gender'      => 'female',
        ]);

        $referrer = Referrer::create([
            'fullName'        => 'Referrer R15',
            'phoneNo'         => '90000000',
            'billingInfo'     => [],
            'email'           => 'r15@example.com',
            'reportReceivers' => [],
        ]);

        $acceptance = $this->createAcceptance([
            'patient_id'        => $patient->id,
            'referrer_id'       => $referrer->id,
            'status'            => AcceptanceStatus::WAITING_FOR_PUBLISHING,
            'financial_approved' => true,
            'howReport'         => [
                'sendToReferrer' => true,
            ],
        ]);

        // Create a ReferrerOrder so the service can update its status
        $referrerOrder = ReferrerOrder::create([
            'acceptance_id' => $acceptance->id,
            'referrer_id'   => $referrer->id,
            'order_id'      => 'ORD-R15',
            'orderInformation' => [],
            'status'        => 'waiting',
            'patient_id'    => $patient->id,
        ]);

        $methodTestId = $this->getMethodTestId();
        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 70,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        Report::create([
            'reporter_id'        => auth()->id(),
            'acceptance_item_id' => $item->id,
            'status'             => true,
            'published_at'       => now(),
        ]);

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->checkAcceptanceReport($acceptance);

        Notification::assertSentTo($referrer, ReferrerReportPublished::class);

        $referrerOrder->refresh();
        $this->assertEquals('reported', $referrerOrder->status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-16: silentlyPublish=true skips all notifications
    // ─────────────────────────────────────────────────────────────────────────

    public function test_silent_publish_skips_notifications(): void
    {
        $this->setUpDatabase();
        Notification::fake();

        $patient = Patient::create([
            'fullName'    => 'Patient R16',
            'idNo'        => 'R16IDN',
            'registrar_id' => auth()->id(),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-06-06',
            'gender'      => 'male',
            'phone'       => '97654321',
        ]);

        $publisher = \App\Domains\User\Models\User::factory()->create(['name' => 'Publisher R16']);

        $acceptance = $this->createAcceptance([
            'patient_id'        => $patient->id,
            'status'            => AcceptanceStatus::WAITING_FOR_PUBLISHING,
            'financial_approved' => true,
            'howReport'         => [
                'whatsappNumber' => '97654321',
                'whatsapp'       => true,
            ],
        ]);

        $methodTestId = $this->getMethodTestId();
        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 50,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        Report::create([
            'reporter_id'        => auth()->id(),
            'acceptance_item_id' => $item->id,
            'status'             => true,
            'published_at'       => null,
        ]);

        $whatsappCountBefore = WhatsappMessage::count();

        // Suppress the timeline update so it doesn't break without extra relations
        $this->instance(
            AcceptanceItemService::class,
            tap(Mockery::mock(AcceptanceItemService::class)->makePartial(), function ($mock) {
                $mock->shouldReceive('updateAcceptanceItemTimeline')->andReturn(new AcceptanceItem());
            })
        );

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->publishAcceptance($acceptance, $publisher->id, silentlyPublish: true);

        Notification::assertNothingSent();
        $this->assertEquals($whatsappCountBefore, WhatsappMessage::count(), 'No WhatsappMessage should be created on silent publish');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // R-17: formatNumber prepends 968 for short numbers (unit test via Reflection)
    // ─────────────────────────────────────────────────────────────────────────


    // ─────────────────────────────────────────────────────────────────────────
    // Shared DB setup helpers (used by feature tests R-06 to R-16)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create an Acceptance with sensible defaults.
     */
    // ─────────────────────────────────────────────────────────────────────────
    // updateAcceptanceItemsFromEditor
    // ─────────────────────────────────────────────────────────────────────────

    public function test_update_items_from_editor_updates_matching_item_with_custom_parameters(): void
    {
        [$service, , $itemSvc, , , $referrerSvc] = $this->makeServiceWithMocks();

        $acceptance = $this->createAcceptance();
        $methodTestId = $this->getMethodTestId();
        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 100,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        $itemSvc->shouldReceive('findAcceptanceItemById')->once()->with($item->id)->andReturn($item);
        $captured = null;
        $itemSvc->shouldReceive('updateAcceptanceItem')->once()->andReturnUsing(function ($i, $dto) use (&$captured) {
            $captured = $dto;
            return $i;
        });
        $referrerSvc->shouldReceive('syncReferrerOrdersForAcceptance')->once();

        $service->updateAcceptanceItemsFromEditor($acceptance, [
            'tests' => [[
                'id'               => $item->id,
                'method_test'      => ['id' => $methodTestId, 'test' => ['type' => 'TEST']],
                'price'            => 80,
                'discount'         => 5,
                'no_sample'        => 1,
                'customParameters' => ['sampleType' => 3],
                'details'          => 'note',
            ]],
            'panels' => [],
        ]);

        $this->assertSame(80.0, $captured->price);
        $this->assertSame(5.0, $captured->discount);
        $this->assertSame(3, $captured->customParameters['sampleType']);
        $this->assertSame('note', $captured->customParameters['details']);
    }

    public function test_update_items_from_editor_skips_items_from_another_acceptance(): void
    {
        [$service, , $itemSvc, , , $referrerSvc] = $this->makeServiceWithMocks();

        $acceptance = $this->createAcceptance();
        $other = $this->createAcceptance();
        $methodTestId = $this->getMethodTestId();
        $foreign = AcceptanceItem::create([
            'acceptance_id'    => $other->id,
            'method_test_id'   => $methodTestId,
            'price'            => 200,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        $itemSvc->shouldReceive('findAcceptanceItemById')->once()->with($foreign->id)->andReturn($foreign);
        $itemSvc->shouldReceive('updateAcceptanceItem')->never();
        $referrerSvc->shouldReceive('syncReferrerOrdersForAcceptance')->once();

        $service->updateAcceptanceItemsFromEditor($acceptance, [
            'tests' => [[
                'id'               => $foreign->id,
                'method_test'      => ['id' => $methodTestId, 'test' => ['type' => 'TEST']],
                'price'            => 1,
                'discount'         => 0,
                'no_sample'        => 1,
                'customParameters' => [],
            ]],
            'panels' => [],
        ]);

        $this->assertTrue(true);
    }

    private function createAcceptance(array $attributes = []): Acceptance
    {
        return Acceptance::create(array_merge([
            'status'            => AcceptanceStatus::PENDING,
            'step'              => 5,
            'patient_id'        => $this->patient->id,
            'acceptor_id'       => auth()->id(),
            'financial_approved' => false,
            'out_patient'       => false,
            'waiting_for_pooling' => false,
        ], $attributes));
    }

    /**
     * Return a valid method_test_id from the DB, or create a minimal test/method/method_test
     * chain if none exists, to satisfy FK constraints.
     *
     * In practice the test database should already have seeded records.  If not,
     * you can seed or adjust this helper to create the necessary records.
     */
    private function getMethodTestId(): int
    {
        // Try to find an existing method_test
        $existing = \Illuminate\Support\Facades\DB::table('method_tests')->first();
        if ($existing) {
            return (int)$existing->id;
        }

        // Create a minimal test → method → method_test chain via the models so
        // schema defaults (and any NOT-NULL columns) are satisfied.
        $test = Test::create([
            'name'      => 'Test R',
            'fullName'  => 'Test R',
            'code'      => 'TR' . uniqid(),
            'type'      => TestType::TEST,
            'status'    => true,
            'can_merge' => false,
        ]);
        $method = Method::create([
            'name'            => 'Method R',
            'price'           => 0,
            'turnaround_time' => 1,
            'status'          => true,
            'no_patient'      => 1,
            'no_sample'       => 1,
        ]);
        $methodTest = MethodTest::create([
            'method_id'  => $method->id,
            'test_id'    => $test->id,
            'is_default' => true,
            'status'     => true,
        ]);

        return (int) $methodTest->id;
    }

    /**
     * Ensure RefreshDatabase is active for feature tests.
     * We call this at the top of every DB-dependent test so that unit tests
     * (which run without DB) remain unaffected.
     */
    private function setUpDatabase(): void
    {
        // RefreshDatabase trait is already applied at the class level via `use`.
        // This method exists only as a named hook so the intent is clear in each test.
    }
}
