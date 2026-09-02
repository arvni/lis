<?php

namespace Tests\Feature\Reception;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class UpdateAcceptanceItemPricesControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Reception.Acceptances.Edit Item Prices';

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        // The service stamps the item timeline with auth()->user()->name.
        $this->actingAs($this->userWithPermission());

        $this->patient = Patient::create([
            'fullName'     => 'Pricing Patient',
            'idNo'         => 'PRC' . Str::random(6),
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    private function userWithPermission(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function createAcceptance(array $attributes = []): Acceptance
    {
        return Acceptance::create(array_merge([
            'status'              => AcceptanceStatus::WAITING_FOR_PAYMENT,
            'step'                => 5,
            'patient_id'          => $this->patient->id,
            'acceptor_id'         => auth()->id(),
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => false,
        ], $attributes));
    }

    private function createItem(Acceptance $acceptance, float $price, float $discount = 0): AcceptanceItem
    {
        return AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $this->getMethodTestId(),
            'price'            => $price,
            'discount'         => $discount,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);
    }

    /**
     * @return array<int, AcceptanceItem> the panel's items, in creation order
     */
    private function createPanelItems(Acceptance $acceptance, int $count, float $price, float $discount = 0): array
    {
        $panelId = (string) Str::uuid();
        $shares = array_fill(0, $count, $price / $count);

        return array_map(fn ($share) => AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $this->getMethodTestId(TestType::PANEL),
            'panel_id'         => $panelId,
            'price'            => $share,
            'discount'         => $discount / $count,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]), $shares);
    }

    private function getMethodTestId(TestType $type = TestType::TEST): int
    {
        $test = Test::create([
            'name'      => 'Test ' . Str::random(4),
            'fullName'  => 'Full Test',
            'code'      => 'T' . uniqid(),
            'type'      => $type,
            'status'    => true,
            'can_merge' => false,
        ]);
        $method = Method::create([
            'name'            => 'Method ' . Str::random(4),
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

    public function test_updates_item_price_and_discount_and_records_timeline(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100, discount: 10);

        $response = $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['id' => $item->id, 'price' => 80, 'discount' => 5],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', true);

        $this->assertDatabaseHas('acceptance_items', [
            'id'       => $item->id,
            'price'    => 80,
            'discount' => 5,
        ]);

        $item->refresh();
        $this->assertStringContainsString(
            'Price set to 80 and discount to 5',
            implode(' ', $item->timeline)
        );
    }

    public function test_does_not_touch_items_that_are_unchanged(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100, discount: 10);
        $originalTimeline = $item->timeline;

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['id' => $item->id, 'price' => 100, 'discount' => 10],
            ],
        ])->assertRedirect();

        $item->refresh();
        // No timeline entry should have been appended for an unchanged item.
        $this->assertSame($originalTimeline, $item->timeline);
    }

    public function test_rejects_discount_greater_than_price(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100, discount: 0);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['id' => $item->id, 'price' => 50, 'discount' => 80],
            ],
        ])->assertSessionHasErrors('items.0.discount');

        $this->assertDatabaseHas('acceptance_items', [
            'id'       => $item->id,
            'price'    => 100,
            'discount' => 0,
        ]);
    }

    public function test_ignores_items_that_do_not_belong_to_the_acceptance(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100);

        $otherAcceptance = $this->createAcceptance();
        $foreignItem = $this->createItem($otherAcceptance, price: 200);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['id' => $foreignItem->id, 'price' => 1, 'discount' => 0],
            ],
        ])->assertRedirect();

        // The foreign item must be untouched.
        $this->assertDatabaseHas('acceptance_items', [
            'id'    => $foreignItem->id,
            'price' => 200,
        ]);
    }

    public function test_forbidden_once_an_invoice_exists(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100);

        $invoice = Invoice::create([
            'owner_type' => Patient::class,
            'owner_id'   => $this->patient->id,
            'user_id'    => auth()->id(),
            'discount'   => 0,
        ]);
        $acceptance->update(['invoice_id' => $invoice->id]);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['id' => $item->id, 'price' => 1, 'discount' => 0],
            ],
        ])->assertForbidden();

        $this->assertDatabaseHas('acceptance_items', [
            'id'    => $item->id,
            'price' => 100,
        ]);
    }

    public function test_updates_a_whole_panel_and_keeps_the_shares_summing_to_the_panel_price(): void
    {
        $acceptance = $this->createAcceptance();
        $panelItems = $this->createPanelItems($acceptance, count: 3, price: 300, discount: 30);
        $panelId = $panelItems[0]->panel_id;

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['panel_id' => $panelId, 'price' => 140, 'discount' => 10],
            ],
        ])->assertRedirect();

        $prices = AcceptanceItem::where('panel_id', $panelId)->pluck('price');
        $discounts = AcceptanceItem::where('panel_id', $panelId)->pluck('discount');

        // 140 / 3 does not divide: the leftover goes to the first items rather
        // than rounding every share up (which would total 141).
        $this->assertEqualsCanonicalizing([47, 47, 46], $prices->map(fn ($p) => (int) $p)->all());
        $this->assertSame(140.0, (float) $prices->sum());
        $this->assertSame(10.0, round((float) $discounts->sum(), 3));
    }

    public function test_a_fully_discounted_panel_never_discounts_an_item_past_its_own_price(): void
    {
        $acceptance = $this->createAcceptance();
        $panelItems = $this->createPanelItems($acceptance, count: 3, price: 300, discount: 30);
        $panelId = $panelItems[0]->panel_id;

        // 10 over 3 prices the items 4/3/3, because prices are stored in whole
        // units — while the discount splits in thousandths. Split apart, the 3.334
        // share lands on an item priced 3, and both columns are unsigned, so every
        // `price - discount` aggregate that touches the row aborts the query.
        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['panel_id' => $panelId, 'price' => 10, 'discount' => 10],
            ],
        ])->assertRedirect();

        $items = AcceptanceItem::where('panel_id', $panelId)->get();

        // The panel still gives away exactly what it was told to.
        $this->assertSame(10.0, (float) $items->sum('price'));
        $this->assertSame(10.0, round((float) $items->sum('discount'), 3));

        foreach ($items as $item) {
            $this->assertLessThanOrEqual((float) $item->price, (float) $item->discount);
        }
    }

    public function test_records_the_panel_total_on_each_item_timeline(): void
    {
        $acceptance = $this->createAcceptance();
        $panelItems = $this->createPanelItems($acceptance, count: 2, price: 100);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['panel_id' => $panelItems[0]->panel_id, 'price' => 75, 'discount' => 0],
            ],
        ])->assertRedirect();

        foreach ($panelItems as $item) {
            $item->refresh();
            $this->assertStringContainsString(
                'share of panel price 75',
                implode(' ', $item->timeline)
            );
        }
    }

    public function test_ignores_a_panel_that_does_not_belong_to_the_acceptance(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100);

        $otherAcceptance = $this->createAcceptance();
        $foreignPanel = $this->createPanelItems($otherAcceptance, count: 2, price: 200);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['panel_id' => $foreignPanel[0]->panel_id, 'price' => 1, 'discount' => 0],
            ],
        ])->assertRedirect();

        foreach ($foreignPanel as $foreignItem) {
            $this->assertDatabaseHas('acceptance_items', [
                'id'    => $foreignItem->id,
                'price' => 100,
            ]);
        }
    }

    public function test_rejects_an_entry_without_an_item_or_panel_reference(): void
    {
        $acceptance = $this->createAcceptance();
        $this->createItem($acceptance, price: 100);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['price' => 10, 'discount' => 0],
            ],
        ])->assertSessionHasErrors('items.0.id');
    }

    public function test_stores_the_parameters_a_dynamic_price_was_calculated_from(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100);
        $item->update(['customParameters' => ['sampleType' => 3, 'discounts' => [['value' => 5]]]]);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                [
                    'id'                => $item->id,
                    'price'             => 240,
                    'discount'          => 0,
                    'custom_parameters' => ['price' => ['area' => 12, 'copies' => 2]],
                ],
            ],
        ])->assertRedirect();

        $item->refresh();
        $this->assertSame(240.0, (float) $item->price);
        $this->assertSame(['area' => 12, 'copies' => 2], $item->customParameters['price']);
        // Everything the parameters do not cover survives the merge.
        $this->assertSame(3, $item->customParameters['sampleType']);
        $this->assertSame(5, $item->customParameters['discounts'][0]['value']);
    }

    public function test_saves_parameters_even_when_the_amounts_did_not_change(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100, discount: 10);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                [
                    'id'                => $item->id,
                    'price'             => 100,
                    'discount'          => 10,
                    'custom_parameters' => ['price' => ['area' => 4]],
                ],
            ],
        ])->assertRedirect();

        $item->refresh();
        $this->assertSame(['area' => 4], $item->customParameters['price']);
        $this->assertStringContainsString('pricing parameters updated', implode(' ', $item->timeline));
    }

    public function test_applies_panel_parameters_to_every_item_of_the_panel(): void
    {
        $acceptance = $this->createAcceptance();
        $panelItems = $this->createPanelItems($acceptance, count: 3, price: 300);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                [
                    'panel_id'          => $panelItems[0]->panel_id,
                    'price'             => 150,
                    'discount'          => 0,
                    'custom_parameters' => ['price' => ['weeks' => 6]],
                ],
            ],
        ])->assertRedirect();

        foreach ($panelItems as $panelItem) {
            $panelItem->refresh();
            // A panel prices as a whole, so its parameters belong on every share.
            $this->assertSame(['weeks' => 6], $panelItem->customParameters['price']);
        }
    }

    public function test_rejects_a_non_numeric_pricing_parameter(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100);

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                [
                    'id'                => $item->id,
                    'price'             => 10,
                    'discount'          => 0,
                    'custom_parameters' => ['price' => ['area' => 'twelve']],
                ],
            ],
        ])->assertSessionHasErrors('items.0.custom_parameters.price.area');

        $this->assertDatabaseHas('acceptance_items', ['id' => $item->id, 'price' => 100]);
    }

    public function test_requires_the_edit_item_prices_permission(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100);

        // A fresh user without the permission.
        $this->actingAs(User::factory()->create());

        $this->put(route('acceptances.updateItemPrices', $acceptance->id), [
            'items' => [
                ['id' => $item->id, 'price' => 1, 'discount' => 0],
            ],
        ])->assertForbidden();

        $this->assertDatabaseHas('acceptance_items', [
            'id'    => $item->id,
            'price' => 100,
        ]);
    }
}
