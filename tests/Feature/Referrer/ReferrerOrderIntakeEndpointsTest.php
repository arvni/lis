<?php

declare(strict_types=1);

namespace Tests\Feature\Referrer;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\User\Models\User;
use App\Events\ReferrerOrderPatientCreated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * HTTP-level coverage of the referrer-order intake chain — attaching a
 * patient, creating the acceptance, and the sample-intake guards
 * (quality-audit item 6: Referrer was the thinnest-covered domain).
 */
class ReferrerOrderIntakeEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private Referrer $referrer;

    private Patient $patient;

    private int $methodTestId;

    protected function setUp(): void
    {
        parent::setUp();

        $registrar = User::factory()->create();

        $this->referrer = Referrer::create([
            'fullName' => 'Intake Referrer',
            'phoneNo' => '90000000',
            'billingInfo' => [],
            'email' => 'intake@referrer.test',
            'reportReceivers' => [],
        ]);

        $this->patient = Patient::create([
            'fullName' => 'Intake Patient',
            'idNo' => 'ROI'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => $registrar->id,
        ]);

        $this->methodTestId = $this->makeMethodTestId();
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
            'fullName' => 'Intake Test',
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

    private function makeOrder(array $attributes = []): ReferrerOrder
    {
        return ReferrerOrder::create(array_merge([
            'referrer_id' => $this->referrer->id,
            'order_id' => 'ORD-'.Str::random(8),
            'status' => 'waiting',
            'orderInformation' => [
                'reference_id' => 'REF-1',
                'patient' => ['name' => 'Intake Patient'],
                'patients' => [
                    ['name' => 'Intake Patient', 'is_main' => true],
                ],
            ],
        ], $attributes));
    }

    private function acceptanceItemsPayload(): array
    {
        return [
            'tests' => [[
                'method_test' => ['id' => $this->methodTestId, 'test' => ['type' => 'TEST']],
                'price' => 100,
                'discount' => 0,
                'no_sample' => 1,
                'customParameters' => [],
            ]],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Attach patient
    // ─────────────────────────────────────────────────────────────────────────

    public function test_patient_endpoint_attaches_existing_patient_and_fires_webhook_event(): void
    {
        Event::fake([ReferrerOrderPatientCreated::class]);

        $order = $this->makeOrder();
        $this->actingAs($this->userWithPermissions(
            'Referrer.Referrer Orders.Add Patient',
            'Reception.Patients.Create Patient',
        ));

        $response = $this->post(route('referrerOrders.patient', $order), [
            'patient' => ['id' => $this->patient->id],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', true);

        $order->refresh();
        $this->assertSame($this->patient->id, $order->patient_id);
        $this->assertSame($this->patient->id, $order->orderInformation['patient']['server_id']);
        $this->assertSame($this->patient->id, $order->orderInformation['patients'][0]['server_id']);

        Event::assertDispatched(ReferrerOrderPatientCreated::class,
            fn (ReferrerOrderPatientCreated $event) => $event->patient->id === $this->patient->id
                && $event->referrerOrder->id === $order->id);
    }

    public function test_patient_endpoint_is_a_no_op_when_patient_already_attached(): void
    {
        Event::fake([ReferrerOrderPatientCreated::class]);

        $order = $this->makeOrder(['patient_id' => $this->patient->id]);
        $otherPatient = Patient::create([
            'fullName' => 'Other Patient',
            'idNo' => 'ROI'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1992-01-01',
            'gender' => 'female',
            'registrar_id' => User::factory()->create()->id,
        ]);

        $this->actingAs($this->userWithPermissions(
            'Referrer.Referrer Orders.Add Patient',
            'Reception.Patients.Create Patient',
        ));

        $this->post(route('referrerOrders.patient', $order), [
            'patient' => ['id' => $otherPatient->id],
        ])->assertRedirect();

        $this->assertSame($this->patient->id, $order->fresh()->patient_id);
        Event::assertNotDispatched(ReferrerOrderPatientCreated::class);
    }

    public function test_patient_endpoint_validates_new_patient_fields_when_no_id_given(): void
    {
        $order = $this->makeOrder();
        $this->actingAs($this->userWithPermissions(
            'Referrer.Referrer Orders.Add Patient',
            'Reception.Patients.Create Patient',
        ));

        $this->post(route('referrerOrders.patient', $order), [])
            ->assertSessionHasErrors(['firstName', 'lastName', 'dateOfBirth']);

        $this->assertNull($order->fresh()->patient_id);
    }

    public function test_patient_endpoint_requires_permission(): void
    {
        $order = $this->makeOrder();
        $this->actingAs(User::factory()->create());

        $this->post(route('referrerOrders.patient', $order), [
            'patient' => ['id' => $this->patient->id],
        ])->assertForbidden();

        $this->assertNull($order->fresh()->patient_id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create acceptance
    // ─────────────────────────────────────────────────────────────────────────

    public function test_acceptance_endpoint_creates_acceptance_and_links_it_to_the_order(): void
    {
        $order = $this->makeOrder(['patient_id' => $this->patient->id]);
        $user = $this->userWithPermissions('Referrer.Referrer Orders.Add Acceptance');
        $this->actingAs($user);

        $response = $this->post(route('referrerOrders.acceptance', $order), [
            'acceptanceItems' => $this->acceptanceItemsPayload(),
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $order->refresh();
        $this->assertNotNull($order->acceptance_id);

        $acceptance = Acceptance::findOrFail($order->acceptance_id);
        $this->assertSame($this->patient->id, $acceptance->patient_id);
        $this->assertSame($this->referrer->id, $acceptance->referrer_id);
        $this->assertSame('REF-1', $acceptance->referenceCode);

        $this->assertSame(1, $acceptance->acceptanceItems()->count());
        $item = $acceptance->acceptanceItems()->first();
        $this->assertSame($this->methodTestId, $item->method_test_id);
        $this->assertSame(100.0, (float) $item->price);
    }

    public function test_acceptance_endpoint_blocks_order_that_already_has_an_acceptance(): void
    {
        $existing = Acceptance::create([
            'status' => AcceptanceStatus::SAMPLING,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => User::factory()->create()->id,
            'financial_approved' => false,
            'out_patient' => true,
            'waiting_for_pooling' => false,
        ]);
        $order = $this->makeOrder([
            'patient_id' => $this->patient->id,
            'acceptance_id' => $existing->id,
        ]);

        $this->actingAs($this->userWithPermissions('Referrer.Referrer Orders.Add Acceptance'));

        $this->post(route('referrerOrders.acceptance', $order), [
            'acceptanceItems' => $this->acceptanceItemsPayload(),
        ])->assertSessionHasErrors();

        $this->assertSame($existing->id, $order->fresh()->acceptance_id);
    }

    public function test_acceptance_endpoint_requires_permission(): void
    {
        $order = $this->makeOrder(['patient_id' => $this->patient->id]);
        $this->actingAs(User::factory()->create());

        $this->post(route('referrerOrders.acceptance', $order), [
            'acceptanceItems' => $this->acceptanceItemsPayload(),
        ])->assertForbidden();

        $this->assertNull($order->fresh()->acceptance_id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sample intake guards
    // ─────────────────────────────────────────────────────────────────────────

    public function test_samples_endpoint_blocks_order_without_acceptance(): void
    {
        $order = $this->makeOrder(['patient_id' => $this->patient->id]);
        $this->actingAs($this->userWithPermissions('Referrer.Referrer Orders.Add Samples'));

        $this->post(route('referrerOrders.samples', $order), $this->samplesPayload())
            ->assertSessionHasErrors();

        $this->assertDatabaseCount('samples', 0);
    }

    public function test_samples_endpoint_requires_permission(): void
    {
        $order = $this->makeOrder(['patient_id' => $this->patient->id]);
        $this->actingAs(User::factory()->create());

        $this->post(route('referrerOrders.samples', $order), $this->samplesPayload())
            ->assertForbidden();
    }

    /**
     * A payload that passes StoreReferrerOrderSamplesRequest validation,
     * so the tests reach the controller's guard clauses.
     */
    private function samplesPayload(): array
    {
        $sampleType = SampleType::create([
            'name' => 'Blood',
            'orderable' => true,
            'required_barcode' => false,
        ]);

        $acceptance = Acceptance::create([
            'status' => AcceptanceStatus::SAMPLING,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => User::factory()->create()->id,
            'financial_approved' => false,
            'out_patient' => true,
            'waiting_for_pooling' => false,
        ]);
        $item = AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $this->methodTestId,
            'price' => 100,
            'discount' => 0,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);

        return [
            'barcodes' => [[
                'patient' => ['id' => $this->patient->id],
                'sampleType' => $sampleType->id,
                'items' => [['id' => $item->id]],
                'collection_date' => now()->format('Y-m-d H:i'),
                'sampleLocation' => 'Main Lab',
                'barcodeGroup' => ['name' => 'A'],
                'barcode' => 'BC'.Str::random(6),
                'received_at' => now()->format('Y-m-d H:i'),
            ]],
        ];
    }
}
