<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Billing\Enums\InvoiceStatus;
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
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The acceptance page carries what a visit costs. Only holders of
 * "Reception.Financials.View" may see the item prices, the invoice and its payments, and
 * the amounts must not merely be hidden in the page — they must never reach the
 * browser at all, since the Inertia payload is readable by anyone who loads it.
 */
class AcceptanceFinancialVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private const VIEW = 'Reception.Acceptances.View Acceptance';

    private const FINANCIALS = 'Reception.Financials.View';

    /**
     * A price distinctive enough that finding it anywhere in the response proves
     * a leak, rather than colliding with an id or a date.
     */
    private const PRICE = 98765;

    private User $registrar;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->registrar = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Money Patient',
            'idNo' => 'FIN'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => $this->registrar->id,
        ]);
    }

    public function test_a_user_without_the_permission_gets_a_page_with_no_amounts_in_it(): void
    {
        $acceptance = $this->acceptanceWithPricedItem();
        $this->invoiceFor($acceptance);

        $response = $this->actingAs($this->userWith([self::VIEW]))
            ->get(route('acceptances.show', $acceptance->id));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canViewFinancials', false)
                ->where('invoice', null)
                ->missing('acceptanceItems.0.price')
                ->missing('acceptanceItems.0.discount')
                ->missing('acceptance.acceptance_items.tests.0.price')
                ->missing('acceptance.acceptance_items.tests.0.discount'));

        // The real guarantee: the amount is nowhere in the payload, not merely
        // absent from the paths the page happens to read.
        $response->assertDontSee((string) self::PRICE);
    }

    public function test_a_user_with_the_permission_sees_the_prices_and_the_invoice(): void
    {
        $acceptance = $this->acceptanceWithPricedItem();
        $invoice = $this->invoiceFor($acceptance);

        $this->actingAs($this->userWith([self::VIEW, self::FINANCIALS]))
            ->get(route('acceptances.show', $acceptance->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canViewFinancials', true)
                ->where('invoice.id', $invoice->id)
                ->has('acceptanceItems.0.price')
                ->has('acceptance.acceptance_items.tests.0.price'));
    }

    public function test_taking_a_payment_needs_its_own_permission_on_top_of_seeing_the_money(): void
    {
        $acceptance = $this->acceptanceWithPricedItem();
        $this->invoiceFor($acceptance);

        // Sees the money, but is not a cashier.
        $this->actingAs($this->userWith([self::VIEW, self::FINANCIALS]))
            ->get(route('acceptances.show', $acceptance->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('canCreatePayment', false));

        $this->actingAs($this->userWith([self::VIEW, self::FINANCIALS, 'Billing.Payments.Create Payment']))
            ->get(route('acceptances.show', $acceptance->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('canCreatePayment', true));
    }

    public function test_the_printed_receipt_rides_on_the_same_permission(): void
    {
        $acceptance = $this->acceptanceWithPricedItem();

        $this->actingAs($this->userWith([self::VIEW]))
            ->get(route('acceptances.print', $acceptance->id))
            ->assertForbidden();

        $this->actingAs($this->userWith([self::VIEW, self::FINANCIALS]))
            ->get(route('acceptances.print', $acceptance->id))
            ->assertOk();
    }

    public function test_editing_item_prices_requires_being_allowed_to_see_them(): void
    {
        $acceptance = $this->acceptanceWithPricedItem();

        $this->actingAs($this->userWith([self::VIEW, 'Reception.Acceptances.Edit Item Prices']))
            ->get(route('acceptances.show', $acceptance->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('canEditItemPrices', false));
    }

    public function test_the_price_editor_unlocks_when_both_permissions_are_held(): void
    {
        $acceptance = $this->acceptanceWithPricedItem();

        $this->actingAs($this->userWith([
            self::VIEW,
            self::FINANCIALS,
            'Reception.Acceptances.Edit Item Prices',
        ]))
            ->get(route('acceptances.show', $acceptance->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('canEditItemPrices', true));
    }

    /**
     * @param  list<string>  $permissions
     */
    private function userWith(array $permissions): User
    {
        $user = User::factory()->create();

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function acceptanceWithPricedItem(): Acceptance
    {
        $acceptance = Acceptance::create([
            'status' => AcceptanceStatus::WAITING_FOR_PAYMENT,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => $this->registrar->id,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);

        AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $this->methodTestId(),
            'price' => self::PRICE,
            'discount' => 0,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);

        return $acceptance;
    }

    private function invoiceFor(Acceptance $acceptance): Invoice
    {
        $invoice = Invoice::create([
            'user_id' => $this->registrar->id,
            'owner_id' => $this->patient->id,
            'owner_type' => 'patient',
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT->value,
            'discount' => 0,
        ]);

        $acceptance->update(['invoice_id' => $invoice->id]);

        return $invoice;
    }

    private function methodTestId(): int
    {
        $test = Test::create([
            'name' => 'Test '.Str::random(4),
            'fullName' => 'Full Test',
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
        $methodTest = MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ]);

        return (int) $methodTest->id;
    }
}
