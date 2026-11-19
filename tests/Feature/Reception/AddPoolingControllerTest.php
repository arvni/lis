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
use App\Domains\Referrer\Events\ReferrerOrderUpdated;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The Add Pooling flow as the dialog drives it: list the pooling sources, then
 * post the picked one. Each round must add one sample to the ORIGINAL item —
 * earlier rounds' pooling copies must never be offered or bumped.
 */
class AddPoolingControllerTest extends TestCase
{
    use RefreshDatabase;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs($this->userWithPermissions());

        $this->patient = Patient::create([
            'fullName' => 'Pooling Patient',
            'idNo' => 'POOL'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    public function test_pooling_a_test_repeatedly_adds_a_sample_each_round(): void
    {
        $methodTest = $this->createMethodTest($this->createTest());
        $acceptance = $this->createAcceptance();
        $original = $this->createItem($acceptance, $methodTest);

        foreach ([2, 3, 4] as $expected) {
            $source = $this->onlySource($acceptance);
            $this->assertSame($original->id, $source['acceptance_item_id']);

            $this->poolTest($acceptance, $methodTest, [$source['acceptance_item_id']]);

            $this->assertSame($expected, $original->fresh()->no_sample);
        }
    }

    public function test_pooling_a_panel_repeatedly_lists_it_once_and_adds_a_sample_each_round(): void
    {
        [$acceptance, $panelItems, $panelMethodTests] = $this->acceptanceWithPanel();

        foreach ([2, 3, 4] as $expected) {
            $source = $this->onlySource($acceptance);
            $this->assertSame(
                $panelItems->pluck('id')->all(),
                array_column($source['panelData']['acceptanceItems'], 'id')
            );

            $this->poolPanel($acceptance, $panelMethodTests, array_column($source['panelData']['acceptanceItems'], 'id'));

            foreach ($panelItems as $item) {
                $this->assertSame($expected, $item->fresh()->no_sample);
            }
        }
    }

    public function test_pooling_a_referred_panel_repeatedly_bumps_only_the_originals(): void
    {
        Event::fake([ReferrerOrderUpdated::class]);
        [$acceptance, $panelItems, $panelMethodTests] = $this->acceptanceWithPanel();
        $this->makeReferred($acceptance);

        foreach ([2, 3, 4] as $expected) {
            $source = $this->onlySource($acceptance);
            $this->poolPanel($acceptance, $panelMethodTests, array_column($source['panelData']['acceptanceItems'], 'id'));

            foreach ($panelItems as $item) {
                $this->assertSame($expected, $item->fresh()->no_sample);
            }
        }

        $copies = AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->whereNotIn('id', $panelItems->pluck('id'))
            ->get();
        $this->assertCount(6, $copies);
        $this->assertTrue($copies->every(fn (AcceptanceItem $copy) => $copy->no_sample === 0));
    }

    public function test_pooling_copies_and_service_items_are_never_offered(): void
    {
        $methodTest = $this->createMethodTest($this->createTest());
        $serviceMethodTest = $this->createMethodTest($this->createTest(TestType::SERVICE));
        $acceptance = $this->createAcceptance();
        $original = $this->createItem($acceptance, $methodTest);
        $this->createItem($acceptance, $serviceMethodTest, sampleless: true);

        $this->poolTest($acceptance, $methodTest, [$original->id]);

        $sources = $this->sources($acceptance);
        $this->assertCount(1, $sources);
        $this->assertSame($original->id, $sources[0]['acceptance_item_id']);
    }

    public function test_posting_a_referred_pooling_copy_id_does_not_bump_it(): void
    {
        // On a referred acceptance the copies lose their is_pooling flag after
        // each round, so only the sampleless guard keeps them from being bumped.
        Event::fake([ReferrerOrderUpdated::class]);
        $methodTest = $this->createMethodTest($this->createTest());
        $acceptance = $this->createAcceptance();
        $this->makeReferred($acceptance);
        $original = $this->createItem($acceptance, $methodTest);

        $this->poolTest($acceptance, $methodTest, [$original->id]);
        $copy = AcceptanceItem::where('acceptance_id', $acceptance->id)->where('id', '!=', $original->id)->sole();

        $this->poolTest($acceptance, $methodTest, [$copy->id]);

        $this->assertSame(2, $original->fresh()->no_sample);
        $this->assertSame(0, $copy->fresh()->no_sample);
    }

    public function test_a_panel_with_a_sampleless_member_is_listed_once_with_its_full_price(): void
    {
        $panel = $this->createTest(TestType::PANEL);
        $sampledMt = $this->createMethodTest($panel);
        $serviceMt = $this->createMethodTest($panel);
        $acceptance = $this->createAcceptance();
        $panelId = (string) Str::uuid();
        $sampled = $this->createItem($acceptance, $sampledMt, panelId: $panelId, price: 40);
        $service = $this->createItem($acceptance, $serviceMt, panelId: $panelId, price: 20, sampleless: true);

        $source = $this->onlySource($acceptance);

        $this->assertEquals(60, $source['panelData']['price']);
        $this->assertSame(
            [$sampled->id, $service->id],
            array_column($source['panelData']['acceptanceItems'], 'id')
        );
    }

    public function test_an_acceptance_not_in_pooling_status_is_refused(): void
    {
        $methodTest = $this->createMethodTest($this->createTest());
        $acceptance = $this->createAcceptance(AcceptanceStatus::WAITING_FOR_PAYMENT);
        $original = $this->createItem($acceptance, $methodTest);

        $this->poolTest($acceptance, $methodTest, [$original->id], expectErrors: true);

        $this->assertSame(1, AcceptanceItem::where('acceptance_id', $acceptance->id)->count());
        $this->assertSame(1, $original->fresh()->no_sample);
    }

    // ── helpers ────────────────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    private function sources(Acceptance $acceptance): array
    {
        return $this->getJson(route('api.acceptances.poolingItems', $acceptance->id))
            ->assertOk()
            ->json('items');
    }

    /** @return array<string, mixed> */
    private function onlySource(Acceptance $acceptance): array
    {
        $sources = $this->sources($acceptance);
        $this->assertCount(1, $sources, 'Each test or panel must be offered exactly once.');

        return $sources[0];
    }

    /** @param  array<int, int>  $originalIds */
    private function poolTest(Acceptance $acceptance, MethodTest $methodTest, array $originalIds, bool $expectErrors = false): void
    {
        $response = $this->post(route('acceptances.addPooling', $acceptance->id), [
            'acceptanceItems' => ['tests' => [[
                'method_test' => ['id' => $methodTest->id],
                'price' => 10,
                'discount' => 0,
                'no_sample' => 1,
                'customParameters' => ['sampleType' => ''],
                'original_acceptance_item_ids' => $originalIds,
            ]]],
        ]);

        $expectErrors ? $response->assertSessionHasErrors() : $response->assertSessionHasNoErrors();
    }

    /**
     * @param  array<int, MethodTest>  $methodTests
     * @param  array<int, int>  $originalIds
     */
    private function poolPanel(Acceptance $acceptance, array $methodTests, array $originalIds): void
    {
        $this->post(route('acceptances.addPooling', $acceptance->id), [
            'acceptanceItems' => ['panels' => [[
                'price' => 60,
                'discount' => 0,
                'acceptanceItems' => array_map(fn (MethodTest $mt) => ['method_test' => ['id' => $mt->id]], $methodTests),
                'original_acceptance_item_ids' => $originalIds,
            ]]],
        ])->assertSessionHasNoErrors();
    }

    /** @return array{0: Acceptance, 1: Collection<int, AcceptanceItem>, 2: array<int, MethodTest>} */
    private function acceptanceWithPanel(): array
    {
        $panel = $this->createTest(TestType::PANEL);
        $methodTests = [$this->createMethodTest($panel), $this->createMethodTest($panel)];
        $acceptance = $this->createAcceptance();
        $panelId = (string) Str::uuid();
        $items = collect($methodTests)->map(
            fn (MethodTest $mt) => $this->createItem($acceptance, $mt, panelId: $panelId, price: 30)
        );

        return [$acceptance, $items, $methodTests];
    }

    private function makeReferred(Acceptance $acceptance): void
    {
        $referrer = Referrer::create([
            'fullName' => 'Pooling Referrer',
            'email' => 'referrer@example.test',
            'phoneNo' => '000',
            'billingInfo' => '{}',
        ]);
        $acceptance->update(['referrer_id' => $referrer->id]);

        ReferrerOrder::create([
            'referrer_id' => $referrer->id,
            'order_id' => 'POOL-'.Str::random(6),
            'status' => 'waiting',
            'pooling' => true,
            'patient_id' => $this->patient->id,
            'acceptance_id' => $acceptance->id,
            'user_id' => auth()->id(),
            'orderInformation' => [],
        ]);
    }

    private function userWithPermissions(): User
    {
        $user = User::factory()->create();
        foreach (['Reception.Acceptances.Edit Acceptance', 'Reception.Acceptances.View Acceptance'] as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function createAcceptance(AcceptanceStatus $status = AcceptanceStatus::POOLING): Acceptance
    {
        return Acceptance::create([
            'status' => $status,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => auth()->id(),
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => $status === AcceptanceStatus::POOLING,
        ]);
    }

    private function createTest(TestType $type = TestType::TEST): Test
    {
        return Test::create([
            'name' => 'Test '.Str::random(4),
            'fullName' => 'Full Test',
            'code' => 'T'.uniqid(),
            'type' => $type,
            'status' => true,
            'can_merge' => false,
            'price' => 10,
        ]);
    }

    private function createMethodTest(Test $test): MethodTest
    {
        $method = Method::create([
            'name' => 'Method '.Str::random(4),
            'price' => 0,
            'turnaround_time' => 1,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);

        return MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ]);
    }

    private function createItem(
        Acceptance $acceptance,
        MethodTest $methodTest,
        ?string $panelId = null,
        float $price = 10,
        bool $sampleless = false,
    ): AcceptanceItem {
        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'panel_id' => $panelId,
            'price' => $price,
            'discount' => 0,
            'reportless' => $sampleless,
            'sampleless' => $sampleless,
            'no_sample' => $sampleless ? 0 : 1,
            'customParameters' => [],
            'timeline' => [],
        ]);
    }
}
