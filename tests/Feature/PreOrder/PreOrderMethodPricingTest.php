<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\Enums\HistoryType;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Support\PreOrderSnapshot;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/** A non-panel test is priced by the method BION picks, from the center's referrer price list. */
class PreOrderMethodPricingTest extends PreOrderTestCase
{
    private function method(string $name, float $price, float $referrerPrice = 0): int
    {
        return (int) DB::table('methods')->insertGetId([
            'name' => $name,
            'price' => $price,
            'price_type' => 'Fix',
            'referrer_price' => $referrerPrice,
            'referrer_price_type' => 'Fix',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function attach(int $testId, int $methodId): int
    {
        return (int) DB::table('method_tests')->insertGetId([
            'test_id' => $testId,
            'method_id' => $methodId,
            'is_default' => false,
            'status' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** @param  list<array<string, mixed>>  $methods */
    private function centerPrices(int $testId, ?float $price = null, array $methods = []): void
    {
        DB::table('referrer_tests')->insert([
            'referrer_id' => $this->referrerId,
            'test_id' => $testId,
            'price_type' => 'Fix',
            'price' => $price,
            'methods' => json_encode($methods),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** A test with no price of its own, so every price below comes from a method or the center. */
    private function unpricedTest(string $code, string $type = 'TEST'): int
    {
        $id = $this->test($code, 'nipt', price: 0);
        DB::table('tests')->where('id', $id)->update(['type' => $type]);

        return $id;
    }

    private function inReview(int $testId): PreOrder
    {
        $preOrder = $this->workflow->submit($this->draft([$testId]), $this->center());

        return $this->workflow->openReview($preOrder, $this->bion());
    }

    private function line(PreOrder $preOrder): PreOrderItem
    {
        return $preOrder->items()->firstOrFail();
    }

    public function test_a_test_with_one_method_gets_it_and_the_centers_price_for_it(): void
    {
        $test = $this->unpricedTest('NIPT1');
        $ngs = $this->method('NGS', price: 300, referrerPrice: 250);
        $mt = $this->attach($test, $ngs);
        $this->centerPrices($test, price: 220, methods: [['method_id' => $ngs, 'price_type' => 'Fix', 'price' => 180]]);

        $line = $this->line($this->inReview($test));

        $this->assertSame($mt, $line->method_test_id);
        $this->assertEquals(180, $line->unit_price);
    }

    public function test_with_several_methods_bion_picks_one_before_confirming_and_it_reprices_the_line(): void
    {
        $test = $this->unpricedTest('WES');
        $ngs = $this->method('NGS', price: 400, referrerPrice: 350);
        $sanger = $this->method('Sanger', price: 200, referrerPrice: 150);
        $this->attach($test, $ngs);
        $sangerMt = $this->attach($test, $sanger);
        // The center has its own price for NGS only, so Sanger falls back to the method's referrer price.
        $this->centerPrices($test, methods: [['method_id' => $ngs, 'price_type' => 'Fix', 'price' => 320]]);
        $preOrder = $this->workflow->setMainTest($this->inReview($test), $test, null, $this->bion());

        $this->assertNull($this->line($preOrder)->method_test_id);
        try {
            $this->workflow->confirmTests($preOrder, $this->bion());
            $this->fail('Confirming without a method should be refused.');
        } catch (PreOrderRuleException $e) {
            $this->assertStringContainsString('Pick the method for WES', $e->getMessage());
        }

        $preOrder = $this->workflow->setItemMethod($preOrder, $this->line($preOrder)->id, $sangerMt, $this->bion());

        $line = $this->line($preOrder);
        $this->assertSame($sangerMt, $line->method_test_id);
        $this->assertEquals(150, $line->unit_price);
        $this->assertTrue($preOrder->histories()->where('type', HistoryType::DECISION->value)->latest('id')->firstOrFail()->internal);
    }

    public function test_the_center_never_sees_the_method(): void
    {
        $test = $this->unpricedTest('NIPT2');
        $this->attach($test, $this->method('NGS', price: 300));
        $preOrder = $this->inReview($test);

        $snapshot = json_encode(app(PreOrderSnapshot::class)->build($preOrder->fresh()));

        $this->assertStringNotContainsString('method', (string) $snapshot);
        $this->assertStringNotContainsString('NGS', (string) $snapshot);
    }

    public function test_a_panel_is_priced_as_a_whole_without_a_method(): void
    {
        $panel = $this->unpricedTest('PANEL1', 'PANEL');
        DB::table('tests')->where('id', $panel)->update(['referrer_price' => 700, 'referrer_price_type' => 'Fix']);
        $this->attach($panel, $this->method('NGS', price: 300));

        $line = $this->line($this->inReview($panel));

        $this->assertNull($line->method_test_id);
        $this->assertEquals(700, $line->unit_price);
    }

    public function test_only_the_tests_own_methods_can_be_picked(): void
    {
        $test = $this->unpricedTest('WES2');
        $this->attach($test, $this->method('NGS', price: 300));
        $this->attach($test, $this->method('Sanger', price: 200));
        $otherMt = $this->attach($this->unpricedTest('OTHER'), $this->method('PCR', price: 90));
        $preOrder = $this->inReview($test);

        $this->expectException(PreOrderRuleException::class);
        $this->workflow->setItemMethod($preOrder, $this->line($preOrder)->id, $otherMt, $this->bion());
    }

    public function test_a_formula_price_is_left_for_finance(): void
    {
        $test = $this->unpricedTest('CNV');
        $method = $this->method('Array', price: 300);
        $this->attach($test, $method);
        $this->centerPrices($test, methods: [['method_id' => $method, 'price_type' => 'Formulate', 'price' => 0, 'extra' => ['formula' => 'genes*100']]]);

        $this->assertNull($this->line($this->inReview($test))->unit_price);
    }

    public function test_bion_sees_the_methods_and_sets_one_with_the_review_permission(): void
    {
        $test = $this->unpricedTest('WES3');
        $this->attach($test, $this->method('NGS', price: 400));
        $sangerMt = $this->attach($test, $this->method('Sanger', price: 200));
        $preOrder = $this->inReview($test);
        $itemId = $this->line($preOrder)->id;
        $reviewer = User::factory()->create();
        foreach (['PreOrders.Cases.View', 'PreOrders.Cases.Review'] as $permission) {
            Permission::findOrCreate($permission);
            $reviewer->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->actingAs(User::factory()->create())
            ->post(route('pre-orders.items.method', [$preOrder->id, $itemId]), ['method_test_id' => $sangerMt])
            ->assertForbidden();

        $this->actingAs($reviewer)
            ->post(route('pre-orders.items.method', [$preOrder->id, $itemId]), ['method_test_id' => $sangerMt])
            ->assertSessionHasNoErrors();
        $this->assertEquals(200, $this->line($preOrder)->unit_price);

        $this->actingAs($reviewer)
            ->get(route('pre-orders.show', $preOrder->id))
            ->assertInertia(fn (Assert $page) => $page
                ->where('preOrder.items.0.method_test_id', $sangerMt)
                ->where('preOrder.items.0.needs_method', true)
                ->has('preOrder.items.0.methods', 2));
    }
}
