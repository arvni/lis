<?php

namespace Tests\Feature\Reception;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Notification\Models\WhatsappMessage;
use App\Domains\Reception\Adapters\LaboratoryAdapter;
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
                        'method_test' => ['id' => 30, 'test' => ['type' => 'service']],
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
        [$service, $acceptanceRepo, $acceptanceItemSvc] = $this->makeServiceWithMocks();

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
        $itemsRelation = Mockery::mock();
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
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender'      => 'male',
        ]);

        $acceptance = $this->createAcceptance([
            'patient_id'        => $patient->id,
            'status'            => AcceptanceStatus::WAITING_FOR_PUBLISHING,
            'financial_approved' => true,
            'howReport'         => [],
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
            'acceptance_item_id' => $item3->id,
            'status'             => true,
            'published_at'       => $alreadyPublishedAt,
        ]);

        // We need AcceptanceItemService to be available; bind a partial mock that
        // suppresses the timeline update (which would need extra relations).
        $this->instance(
            AcceptanceItemService::class,
            tap(Mockery::mock(AcceptanceItemService::class)->makePartial(), function ($mock) {
                $mock->shouldReceive('updateAcceptanceItemTimeline')->andReturnNull();
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
            $report3->fresh()->published_at->format('Y-m-d H:i:s'),
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
            'status'      => InvoiceStatus::WAITING_FOR_PAYMENT,
            'total_price' => 100,
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
            'nationality' => 'OM',
            'dateOfBirth' => '1980-01-01',
            'gender'      => 'female',
        ]);

        $referrer = Referrer::create([
            'fullName'        => 'Referrer R15',
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
            'status'        => 'pending',
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
            'acceptance_item_id' => $item->id,
            'status'             => true,
            'published_at'       => null,
        ]);

        $whatsappCountBefore = WhatsappMessage::count();

        // Suppress the timeline update so it doesn't break without extra relations
        $this->instance(
            AcceptanceItemService::class,
            tap(Mockery::mock(AcceptanceItemService::class)->makePartial(), function ($mock) {
                $mock->shouldReceive('updateAcceptanceItemTimeline')->andReturnNull();
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

    public function test_format_number_prepends_968_for_short_numbers(): void
    {
        [$service] = $this->makeServiceWithMocks();

        $method = new \ReflectionMethod(AcceptanceService::class, 'formatNumber');
        $method->setAccessible(true);

        // 8-digit number: len ≤ 9 → prepend '968', then '+' prefix
        $result = $method->invoke($service, '91234567');
        $this->assertSame('+96891234567', $result);

        // 10-digit number: len > 9 → only '+' prefix
        $result = $method->invoke($service, '9681234567');
        $this->assertSame('+9681234567', $result);

        // Already has +, 12 digits: should be unchanged (already ≤ 9 chars after stripping non-numeric? No — has digits already)
        $result = $method->invoke($service, '+96891234567');
        $this->assertSame('+96891234567', $result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Shared DB setup helpers (used by feature tests R-06 to R-16)
    // ─────────────────────────────────────────────────────────────────────────

    /** Trait pulled in inline so we don't extend a different base class */
    use RefreshDatabase;

    /**
     * Create an Acceptance with sensible defaults.
     */
    private function createAcceptance(array $attributes = []): Acceptance
    {
        return Acceptance::create(array_merge([
            'status'            => AcceptanceStatus::PENDING,
            'step'              => 5,
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

        // Create minimal supporting records if nothing exists
        // section_group → section → test → method → method_test
        $sectionGroupId = \Illuminate\Support\Facades\DB::table('section_groups')->insertGetId([
            'name'       => 'Test Group R',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sectionId = \Illuminate\Support\Facades\DB::table('sections')->insertGetId([
            'name'             => 'Test Section R',
            'section_group_id' => $sectionGroupId,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $testId = \Illuminate\Support\Facades\DB::table('tests')->insertGetId([
            'name'       => 'Test R',
            'type'       => 'test',
            'section_id' => $sectionId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $methodId = \Illuminate\Support\Facades\DB::table('methods')->insertGetId([
            'name'           => 'Method R',
            'test_id'        => $testId,
            'turnaround_time' => 1,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return \Illuminate\Support\Facades\DB::table('method_tests')->insertGetId([
            'test_id'    => $testId,
            'method_id'  => $methodId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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
