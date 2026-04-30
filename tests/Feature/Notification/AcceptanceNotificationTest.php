<?php

namespace Tests\Feature\Notification;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Notification\Models\WhatsappMessage;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Notifications\PatientReportPublished;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Reception\Services\AcceptanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Mockery;
use Tests\TestCase;

class AcceptanceNotificationTest extends TestCase
{
    use RefreshDatabase;

    private Patient $patient;
    private MethodTest $methodTest;

    protected function setUp(): void
    {
        parent::setUp();

        $this->patient = Patient::create([
            'fullName'    => 'Notify Test Patient',
            'idNo'        => 'NTY001',
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender'      => 'male',
            'phone'       => '91234567',
        ]);

        $method = Method::create([
            'name'           => 'Notify Method',
            'turnaround_time'=> 1,
            'status'         => true,
        ]);

        $test = Test::create([
            'name'      => 'Notify Test',
            'code'      => 'NTY001',
            'type'      => TestType::TEST,
            'status'    => true,
            'can_merge' => false,
        ]);

        $this->methodTest = MethodTest::create([
            'method_id'  => $method->id,
            'test_id'    => $test->id,
            'is_default' => true,
            'status'     => true,
        ]);

        // Suppress AcceptanceItemService timeline calls to avoid extra dependencies
        $this->instance(
            AcceptanceItemService::class,
            tap(Mockery::mock(AcceptanceItemService::class)->makePartial(), function ($m) {
                $m->shouldReceive('updateAcceptanceItemTimeline')->andReturnNull();
            })
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function createAcceptance(array $howReport = []): Acceptance
    {
        return Acceptance::create([
            'patient_id'         => $this->patient->id,
            'status'             => AcceptanceStatus::WAITING_FOR_PUBLISHING,
            'step'               => 5,
            'financial_approved' => true,
            'out_patient'        => false,
            'waiting_for_pooling'=> false,
            'howReport'          => $howReport,
        ]);
    }

    private function addPublishedItem(Acceptance $acceptance): AcceptanceItem
    {
        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $this->methodTest->id,
            'price'            => 50,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        $report = Report::create([
            'acceptance_item_id' => $item->id,
            'status'             => true,
            'published_at'       => now(),
        ]);

        // Create the published document so the notification code can access ->hash
        Document::create([
            'related_type'  => Report::class,
            'related_id'    => $report->id,
            'owner_type'    => Acceptance::class,
            'owner_id'      => $acceptance->id,
            'tag'           => DocumentTag::PUBLISHED,
            'hash'          => 'abc123hash',
            'ext'           => 'pdf',
            'originalName'  => 'report.pdf',
            'path'          => '/tmp/report.pdf',
        ]);

        return $item;
    }

    // -------------------------------------------------------------------------
    // N-17: publishAcceptance creates WhatsappMessage records for each item
    // -------------------------------------------------------------------------

    public function test_acceptance_service_creates_whatsapp_message_records_on_publish(): void
    {
        Notification::fake();

        $acceptance = $this->createAcceptance([
            'whatsappNumber' => '91234567',
            'whatsapp'       => true,
            'email'          => false,
        ]);

        $this->addPublishedItem($acceptance);
        $this->addPublishedItem($acceptance);

        $publisher = \App\Domains\User\Models\User::factory()->create(['name' => 'Publisher N17']);

        $beforeCount = WhatsappMessage::count();

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->publishAcceptance($acceptance, $publisher->id, silentlyPublish: false);

        $afterCount = WhatsappMessage::count();

        $this->assertGreaterThan($beforeCount, $afterCount, 'WhatsappMessage records should be created on publish');

        // Verify waId format: '968' + 8-digit number (without '+')
        $msg = WhatsappMessage::latest()->first();
        $this->assertEquals('96891234567', $msg->waId);
        $this->assertEquals('initial', $msg->status);
    }

    // -------------------------------------------------------------------------
    // N-18: publishAcceptance skips WhatsappMessage creation when no number set
    // -------------------------------------------------------------------------

    public function test_acceptance_service_skips_whatsapp_messages_when_no_number(): void
    {
        Notification::fake();

        // howReport without whatsappNumber
        $acceptance = $this->createAcceptance([
            'email' => false,
        ]);

        $this->addPublishedItem($acceptance);

        $publisher = \App\Domains\User\Models\User::factory()->create(['name' => 'Publisher N18']);

        $beforeCount = WhatsappMessage::count();

        /** @var AcceptanceService $service */
        $service = app(AcceptanceService::class);
        $service->publishAcceptance($acceptance, $publisher->id, silentlyPublish: false);

        $this->assertEquals($beforeCount, WhatsappMessage::count(), 'No WhatsappMessage should be created when whatsappNumber is absent');
    }
}
