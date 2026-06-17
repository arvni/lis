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

class UpdateAcceptanceItemControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Reception.Acceptances.Edit Item Prices';

    private Patient $patient;
    private int $methodTestId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs($this->userWithPermission());

        $this->patient = Patient::create([
            'fullName'     => 'Editor Patient',
            'idNo'         => 'EDT' . Str::random(6),
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);

        $this->methodTestId = $this->makeMethodTestId();
    }

    private function userWithPermission(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function makeMethodTestId(): int
    {
        $test = Test::create([
            'name'      => 'Test ' . Str::random(4),
            'fullName'  => 'Full Test',
            'code'      => 'T' . uniqid(),
            'type'      => TestType::TEST,
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

        return (int) MethodTest::create([
            'method_id'  => $method->id,
            'test_id'    => $test->id,
            'is_default' => true,
            'status'     => true,
        ])->id;
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
            'method_test_id'   => $this->methodTestId,
            'price'            => $price,
            'discount'         => $discount,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => ['sampleType' => 1],
            'timeline'         => [],
        ]);
    }

    /** A single edited test in the editor payload shape. */
    private function testPayload(AcceptanceItem $item, float $price, float $discount, array $customParameters = [], string $details = ''): array
    {
        return [
            'tests' => [[
                'id'               => $item->id,
                'method_test'      => ['id' => $this->methodTestId, 'test' => ['type' => 'TEST']],
                'price'            => $price,
                'discount'         => $discount,
                'no_sample'        => 1,
                'customParameters' => $customParameters,
                'details'          => $details,
            ]],
        ];
    }

    public function test_updates_price_discount_and_custom_parameters(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100, discount: 0);

        $response = $this->put(
            route('acceptances.updateItem', $acceptance->id),
            $this->testPayload(
                $item,
                price: 80,
                discount: 12,
                customParameters: ['sampleType' => 7, 'discounts' => [['type' => 'FIXED', 'value' => 12, 'reason' => 'loyalty']]],
                details: 'Handle with care'
            )
        );

        $response->assertRedirect();
        $response->assertSessionHas('success', true);

        $item->refresh();
        $this->assertSame(80.0, (float) $item->price);
        $this->assertSame(12.0, (float) $item->discount);
        $this->assertSame(7, $item->customParameters['sampleType']);
        $this->assertSame('Handle with care', $item->customParameters['details']);
        $this->assertSame('loyalty', $item->customParameters['discounts'][0]['reason']);
    }

    public function test_rejects_discount_greater_than_price(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100, discount: 0);

        $this->put(
            route('acceptances.updateItem', $acceptance->id),
            $this->testPayload($item, price: 50, discount: 90)
        )->assertSessionHasErrors('tests.0.discount');

        $this->assertDatabaseHas('acceptance_items', [
            'id'    => $item->id,
            'price' => 100,
        ]);
    }

    public function test_ignores_items_from_another_acceptance(): void
    {
        $acceptance = $this->createAcceptance();
        $this->createItem($acceptance, price: 100);

        $other = $this->createAcceptance();
        $foreignItem = $this->createItem($other, price: 200);

        $this->put(
            route('acceptances.updateItem', $acceptance->id),
            $this->testPayload($foreignItem, price: 1, discount: 0)
        )->assertRedirect();

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

        $this->put(
            route('acceptances.updateItem', $acceptance->id),
            $this->testPayload($item, price: 1, discount: 0)
        )->assertForbidden();

        $this->assertDatabaseHas('acceptance_items', ['id' => $item->id, 'price' => 100]);
    }

    public function test_requires_the_edit_item_prices_permission(): void
    {
        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, price: 100);

        $this->actingAs(User::factory()->create());

        $this->put(
            route('acceptances.updateItem', $acceptance->id),
            $this->testPayload($item, price: 1, discount: 0)
        )->assertForbidden();

        $this->assertDatabaseHas('acceptance_items', ['id' => $item->id, 'price' => 100]);
    }
}
