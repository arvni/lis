<?php

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\AcceptanceItemConversion;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Services\AcceptanceItemConversionService;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ReflectionMethod;
use Tests\TestCase;

/**
 * DB-bound coverage for AcceptanceItemConversionService: the public panel
 * conversions (ejectPanel / promoteToPanel) and the price cascade's model
 * lookups (calculatePrice). The pure formula/guard helpers are covered
 * separately by the unit test of the same name under tests/Unit.
 */
class AcceptanceItemConversionServiceTest extends TestCase
{
    use RefreshDatabase;

    private AcceptanceItemConversionService $service;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        // logConversion stamps auth()->id(); promoteToPanel stamps
        // auth()->user()?->name into the new item's timeline.
        $this->actingAs(User::factory()->create());

        $this->patient = Patient::create([
            'fullName' => 'Conversion Patient',
            'idNo' => 'CONV001',
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);

        $this->service = app(AcceptanceItemConversionService::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fixtures
    // ─────────────────────────────────────────────────────────────────────────

    private function createTest(float $price, MethodPriceType $priceType = MethodPriceType::FIX, array $overrides = []): Test
    {
        return Test::create(array_merge([
            'name' => 'Test '.uniqid(),
            'fullName' => 'Full Test',
            'code' => 'T'.uniqid(),
            'type' => TestType::TEST,
            'status' => true,
            'can_merge' => false,
            'price' => $price,
            'price_type' => $priceType,
        ], $overrides));
    }

    private function createMethod(float $price, MethodPriceType $priceType = MethodPriceType::FIX, array $overrides = []): Method
    {
        return Method::create(array_merge([
            'name' => 'Method '.uniqid(),
            'price' => $price,
            'price_type' => $priceType,
            'turnaround_time' => 1,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ], $overrides));
    }

    private function createMethodTest(Method $method, Test $test, bool $isDefault): MethodTest
    {
        return MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => $isDefault,
            'status' => true,
        ]);
    }

    private function createAcceptance(?int $referrerId = null): Acceptance
    {
        return Acceptance::create([
            'status' => AcceptanceStatus::PENDING,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => auth()->id(),
            'referrer_id' => $referrerId,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
    }

    private function createItem(Acceptance $acceptance, MethodTest $methodTest, array $overrides = []): AcceptanceItem
    {
        return AcceptanceItem::create(array_merge([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 999,
            'discount' => 0,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ], $overrides));
    }

    /** @param mixed ...$args */
    private function invokePrivate(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(AcceptanceItemConversionService::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->service, ...$args);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ejectPanel
    // ─────────────────────────────────────────────────────────────────────────

    public function test_eject_panel_reverts_item_to_method_default_and_logs_conversion(): void
    {
        $method = $this->createMethod(price: 0);
        $defaultTest = $this->createTest(price: 40);
        $altTest = $this->createTest(price: 0);
        $defaultMt = $this->createMethodTest($method, $defaultTest, isDefault: true);
        $altMt = $this->createMethodTest($method, $altTest, isDefault: false);

        $acceptance = $this->createAcceptance();
        // Item currently sits on the non-default method test inside a panel.
        $item = $this->createItem($acceptance, $altMt, [
            'panel_id' => 'panel-uuid-1',
            'price' => 999,
            'discount' => 5,
        ]);

        $updated = $this->service->ejectPanel($item);

        $item->refresh();
        $this->assertNull($item->panel_id, 'panel_id is cleared');
        $this->assertSame($defaultMt->id, $item->method_test_id, 'reverts to the method default MethodTest');
        $this->assertEqualsWithDelta(0.0, (float) $item->discount, 0.001, 'discount is zeroed');
        // Price is recalculated from the default test (FIX 40), not the old 999.
        $this->assertEqualsWithDelta(40.0, (float) $item->price, 0.001);

        $this->assertCount(1, $updated);

        $this->assertDatabaseHas('acceptance_item_conversions', [
            'acceptance_item_id' => $item->id,
            'from_method_test_id' => $altMt->id,
            'to_method_test_id' => $defaultMt->id,
            'conversion_type' => 'eject_panel',
            'converted_by' => auth()->id(),
        ]);
    }

    public function test_eject_panel_processes_every_item_sharing_the_panel(): void
    {
        $method = $this->createMethod(price: 0);
        $defaultTest = $this->createTest(price: 25);
        $altTest = $this->createTest(price: 0);
        $defaultMt = $this->createMethodTest($method, $defaultTest, isDefault: true);
        $altMt = $this->createMethodTest($method, $altTest, isDefault: false);

        $acceptance = $this->createAcceptance();
        $itemA = $this->createItem($acceptance, $altMt, ['panel_id' => 'shared-panel']);
        $itemB = $this->createItem($acceptance, $altMt, ['panel_id' => 'shared-panel']);

        $updated = $this->service->ejectPanel($itemA);

        $this->assertCount(2, $updated, 'both items in the panel are ejected');
        foreach ([$itemA, $itemB] as $item) {
            $item->refresh();
            $this->assertNull($item->panel_id);
            $this->assertSame($defaultMt->id, $item->method_test_id);
        }
        $this->assertSame(2, AcceptanceItemConversion::count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // promoteToPanel
    // ─────────────────────────────────────────────────────────────────────────

    public function test_promote_to_panel_matches_item_and_creates_missing_panel_items(): void
    {
        // Panel composed of two component method tests sharing the same panel
        // test_id but distinct methods (the method_id is the discriminator).
        $panelTest = $this->createTest(price: 60);
        $methodA = $this->createMethod(price: 0);
        $methodB = $this->createMethod(price: 0);
        $panelMtA = $this->createMethodTest($methodA, $panelTest, isDefault: false);
        $panelMtB = $this->createMethodTest($methodB, $panelTest, isDefault: false);

        // The selected item lives on methodA's individual test → matches panelMtA.
        $individualTest = $this->createTest(price: 10);
        $individualMt = $this->createMethodTest($methodA, $individualTest, isDefault: true);

        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, $individualMt);

        $results = $this->service->promoteToPanel(
            [$item->id],
            [$panelMtA->id, $panelMtB->id],
        );

        // One matched (updated) + one created for the uncovered panel method test.
        $this->assertCount(2, $results);

        $item->refresh();
        $this->assertSame($panelMtA->id, $item->method_test_id, 'matched item moves to the panel method test');
        $this->assertNotNull($item->panel_id);
        $this->assertEqualsWithDelta(0.0, (float) $item->discount, 0.001);

        // A new item was created for panelMtB and shares the panel_id.
        $created = AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->where('method_test_id', $panelMtB->id)
            ->first();
        $this->assertNotNull($created, 'a panel item is created for the uncovered method test');
        $this->assertSame($item->panel_id, $created->panel_id, 'all panel items share one panel_id');
        // The panel's 60 is a total split over its two items, not charged twice.
        $this->assertEqualsWithDelta(30.0, (float) $created->price, 0.001);
        $this->assertEqualsWithDelta(30.0, (float) $item->price, 0.001);

        $this->assertDatabaseHas('acceptance_item_conversions', [
            'acceptance_item_id' => $item->id,
            'from_method_test_id' => $individualMt->id,
            'to_method_test_id' => $panelMtA->id,
            'conversion_type' => 'promote_to_panel',
        ]);
    }

    public function test_promote_to_panel_splits_an_indivisible_panel_total_without_losing_money(): void
    {
        // 100 over three items does not divide evenly — the shares must still add
        // back up to the panel price exactly.
        $panelTest = $this->createTest(price: 100);
        $methods = [$this->createMethod(price: 0), $this->createMethod(price: 0), $this->createMethod(price: 0)];
        $panelMts = array_map(
            fn (Method $method) => $this->createMethodTest($method, $panelTest, isDefault: false),
            $methods
        );

        $individualMt = $this->createMethodTest($methods[0], $this->createTest(price: 10), isDefault: true);
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, $individualMt);

        $this->service->promoteToPanel(
            [$item->id],
            array_map(fn (MethodTest $mt) => $mt->id, $panelMts)
        );

        $panelId = $item->refresh()->panel_id;
        $prices = AcceptanceItem::where('panel_id', $panelId)
            ->pluck('price')
            ->map(fn ($price) => (float) $price)
            ->all();

        $this->assertCount(3, $prices);
        $this->assertEqualsWithDelta(100.0, array_sum($prices), 0.001);
    }

    public function test_promote_to_panel_keeps_method_level_prices_per_item(): void
    {
        // The panel test carries no price, so each item resolves its own method
        // price — those are already per-item amounts and must not be split.
        $panelTest = $this->createTest(price: 0);
        $methodA = $this->createMethod(price: 40);
        $methodB = $this->createMethod(price: 25);
        $panelMtA = $this->createMethodTest($methodA, $panelTest, isDefault: false);
        $panelMtB = $this->createMethodTest($methodB, $panelTest, isDefault: false);

        $individualMt = $this->createMethodTest($methodA, $this->createTest(price: 0), isDefault: true);
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, $individualMt);

        $this->service->promoteToPanel([$item->id], [$panelMtA->id, $panelMtB->id]);

        $item->refresh();
        $created = AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->where('method_test_id', $panelMtB->id)
            ->first();

        $this->assertEqualsWithDelta(40.0, (float) $item->price, 0.001);
        $this->assertEqualsWithDelta(25.0, (float) $created->price, 0.001);
    }

    public function test_promote_to_panel_splits_the_referrer_panel_price_when_acceptance_is_referred(): void
    {
        $referrer = Referrer::create([
            'fullName' => 'Conversion Referrer',
            'phoneNo' => '90000001',
            'billingInfo' => [],
            'email' => 'conversion@example.com',
            'reportReceivers' => [],
        ]);

        // No ReferrerTest row, so the cascade reaches the panel's referrer price.
        $panelTest = $this->createTest(price: 60, overrides: [
            'referrer_price' => 90,
            'referrer_price_type' => MethodPriceType::FIX,
        ]);
        $methodA = $this->createMethod(price: 0);
        $methodB = $this->createMethod(price: 0);
        $panelMtA = $this->createMethodTest($methodA, $panelTest, isDefault: false);
        $panelMtB = $this->createMethodTest($methodB, $panelTest, isDefault: false);

        $individualMt = $this->createMethodTest($methodA, $this->createTest(price: 10), isDefault: true);
        $acceptance = $this->createAcceptance($referrer->id);
        $item = $this->createItem($acceptance, $individualMt);

        $this->service->promoteToPanel([$item->id], [$panelMtA->id, $panelMtB->id]);

        $item->refresh();
        $created = AcceptanceItem::where('acceptance_id', $acceptance->id)
            ->where('method_test_id', $panelMtB->id)
            ->first();

        // The referrer tariff (90) is used instead of the individual one (60), and
        // it is a panel total split over the two items.
        $this->assertEqualsWithDelta(45.0, (float) $item->price, 0.001);
        $this->assertEqualsWithDelta(45.0, (float) $created->price, 0.001);
    }

    public function test_promote_to_panel_logs_conversion_only_for_promoted_items(): void
    {
        $panelTest = $this->createTest(price: 60);
        $methodA = $this->createMethod(price: 0);
        $methodB = $this->createMethod(price: 0);
        $panelMtA = $this->createMethodTest($methodA, $panelTest, isDefault: false);
        $panelMtB = $this->createMethodTest($methodB, $panelTest, isDefault: false);

        $individualMt = $this->createMethodTest($methodA, $this->createTest(price: 10), isDefault: true);
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, $individualMt);

        $this->service->promoteToPanel([$item->id], [$panelMtA->id, $panelMtB->id]);

        // The created (uncovered) item is brand new — no conversion is logged for it.
        $this->assertSame(1, AcceptanceItemConversion::count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // calculatePrice cascade (private, exercised via reflection with real models)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_calculate_price_uses_individual_test_price_without_referrer(): void
    {
        $test = $this->createTest(price: 50);
        $method = $this->createMethod(price: 30);

        $price = $this->invokePrivate('calculatePrice', $test->id, $method->id, null, []);

        $this->assertSame(50.0, $price);
    }

    public function test_calculate_price_falls_through_to_method_when_test_price_zero(): void
    {
        // Test price resolves to 0 (not > 0), so the cascade continues to the method.
        $test = $this->createTest(price: 0);
        $method = $this->createMethod(price: 30);

        $price = $this->invokePrivate('calculatePrice', $test->id, $method->id, null, []);

        $this->assertSame(30.0, $price);
    }

    public function test_calculate_price_prefers_test_referrer_price_when_referrer_present(): void
    {
        // No ReferrerTest row exists, so the cascade reaches the test-level
        // referrer price (step 3) before the individual price (step 5).
        $test = $this->createTest(price: 50, overrides: [
            'referrer_price' => 80,
            'referrer_price_type' => MethodPriceType::FIX,
        ]);
        $method = $this->createMethod(price: 30);

        $price = $this->invokePrivate('calculatePrice', $test->id, $method->id, 999, []);

        $this->assertSame(80.0, $price);
    }
}
