<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Events\ReferrerOrderCreated;
use App\Domains\Referrer\Events\ReferrerOrderUpdated;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The acceptance page's "Sync with provider" button: offered only for a referred acceptance with
 * a reportable item, and it re-sends the acceptance's orders to the provider.
 */
class SyncAcceptanceWithProviderControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Reception.Acceptances.Sync With Provider';

    private Patient $patient;

    private Referrer $referrer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Event::fake([ReferrerOrderUpdated::class, ReferrerOrderCreated::class]);

        $this->actingAs($this->userWithPermission());

        $this->patient = Patient::create([
            'fullName' => 'Sync Patient',
            'idNo' => 'SYN'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);
        $this->referrer = Referrer::create([
            'fullName' => 'Sync Referrer',
            'email' => 'sync'.uniqid().'@example.com',
            'phoneNo' => '90000000',
            'billingInfo' => [],
        ]);
    }

    public function test_a_referred_acceptance_resends_its_orders_to_the_provider(): void
    {
        $acceptance = $this->createAcceptance(referred: true);
        $this->createItem($acceptance, reportless: false);
        $order = $this->createOrder($acceptance);

        $this->post(route('acceptances.syncWithProvider', $acceptance))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('status', 'The order is being sent to the provider again.');

        Event::assertDispatched(ReferrerOrderUpdated::class, fn (ReferrerOrderUpdated $e) => $e->referrerOrder->is($order));
    }

    public function test_it_says_why_when_there_is_nothing_ready_to_send(): void
    {
        // No order yet, and nothing has been sampled, so there is nothing to create one from.
        $acceptance = $this->createAcceptance(referred: true);
        $this->createItem($acceptance, reportless: false);

        $this->post(route('acceptances.syncWithProvider', $acceptance))
            ->assertSessionHasErrors(['sync' => 'Nothing on this acceptance is ready to send yet. Collect its samples first.']);

        $this->assertSame(0, ReferrerOrder::query()->count());
        Event::assertNotDispatched(ReferrerOrderCreated::class);
    }

    public function test_only_a_referred_acceptance_with_a_reportable_item_can_be_synced(): void
    {
        $notReferred = $this->createAcceptance(referred: false);
        $this->createItem($notReferred, reportless: false);

        $onlyReportless = $this->createAcceptance(referred: true);
        $this->createItem($onlyReportless, reportless: true);
        $this->createOrder($onlyReportless);

        $this->post(route('acceptances.syncWithProvider', $notReferred))->assertForbidden();
        $this->post(route('acceptances.syncWithProvider', $onlyReportless))->assertForbidden();
        Event::assertNotDispatched(ReferrerOrderUpdated::class);

        $this->get(route('acceptances.show', $onlyReportless))
            ->assertInertia(fn ($page) => $page->where('canSyncWithProvider', false));
    }

    public function test_it_needs_the_permission(): void
    {
        $acceptance = $this->createAcceptance(referred: true);
        $this->createItem($acceptance, reportless: false);
        $this->createOrder($acceptance);

        $this->get(route('acceptances.show', $acceptance))
            ->assertInertia(fn ($page) => $page->where('canSyncWithProvider', true));

        $this->actingAs(User::factory()->create())
            ->post(route('acceptances.syncWithProvider', $acceptance))
            ->assertForbidden();
        Event::assertNotDispatched(ReferrerOrderUpdated::class);
    }

    private function userWithPermission(): User
    {
        $user = User::factory()->create();
        foreach ([self::PERMISSION, 'Reception.Acceptances.View Acceptance'] as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function createAcceptance(bool $referred): Acceptance
    {
        return Acceptance::create([
            'status' => AcceptanceStatus::PROCESSING,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => auth()->id(),
            'referrer_id' => $referred ? $this->referrer->id : null,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
    }

    private function createItem(Acceptance $acceptance, bool $reportless): AcceptanceItem
    {
        $test = Test::create([
            'name' => 'Test '.Str::random(4),
            'fullName' => 'Full Test',
            'code' => 'T'.uniqid(),
            'type' => TestType::TEST,
            'status' => true,
            'can_merge' => false,
            'price' => 10,
        ]);
        $method = Method::create([
            'name' => 'Method '.Str::random(4),
            'price' => 0,
            'turnaround_time' => 1,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);
        $methodTest = MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ]);

        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 10,
            'discount' => 0,
            'reportless' => $reportless,
            'sampleless' => $reportless,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);
    }

    private function createOrder(Acceptance $acceptance): ReferrerOrder
    {
        return ReferrerOrder::create([
            'acceptance_id' => $acceptance->id,
            'referrer_id' => $this->referrer->id,
            'order_id' => 'ORD-'.uniqid(),
            'orderInformation' => [],
            'status' => 'processing',
            'patient_id' => $this->patient->id,
        ]);
    }
}
