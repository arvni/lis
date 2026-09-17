<?php

declare(strict_types=1);

namespace Tests\Feature\Payroll;

use App\Domains\Payroll\Enums\AllowanceKind;
use App\Domains\Payroll\Enums\PayrollCalculation;
use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Payroll\Models\PayrollItemType;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class PayrollItemControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = [
        'Payroll.Staff Allowances.List Staff Allowances',
        'Payroll.Staff Allowances.Manage Staff Allowances',
    ];

    private User $person;

    private PayrollItemType $housing;

    private PayrollItemType $loan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->person = User::factory()->create(['name' => 'Sara Ahmed']);
        $this->housing = PayrollItemType::create([
            'name' => 'Housing allowance',
            'kind' => AllowanceKind::ALLOWANCE->value,
            'default_amount' => '150.000',
        ]);
        $this->loan = PayrollItemType::create(['name' => 'Loan', 'kind' => AllowanceKind::DEDUCTION->value]);
    }

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('payroll.staff-allowances.index'))
            ->assertForbidden();
    }

    public function test_items_are_listed_with_their_person_and_shape(): void
    {
        $this->item(['calculation' => PayrollCalculation::FIXED->value, 'amount' => '150.000']);

        $this->actingAs($this->permittedUser())
            ->get(route('payroll.staff-allowances.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payroll/StaffAllowances/Index', false)
                ->where('items.total', 1)
                ->where('items.data.0.user.name', 'Sara Ahmed')
                ->where('items.data.0.type', 'Housing allowance')
                ->where('items.data.0.calculation_label', 'Fixed amount')
                ->has('itemTypes', 2)
                ->has('calculations', 3));
    }

    public function test_a_fixed_item_is_created(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.staff-allowances.store'), [
                'user_id' => $this->person->id,
                'payroll_item_type_id' => $this->housing->id,
                'calculation' => PayrollCalculation::FIXED->value,
                'amount' => '150.000',
                'start_date' => '2026-01-01',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payroll_items', [
            'user_id' => $this->person->id,
            'calculation' => 'FIXED',
            'amount' => '150.000',
            'percentage' => null,
            'total_amount' => null,
        ]);
    }

    public function test_a_loan_is_created_with_its_total_and_instalments(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.staff-allowances.store'), [
                'user_id' => $this->person->id,
                'payroll_item_type_id' => $this->loan->id,
                'calculation' => PayrollCalculation::INSTALLMENTS->value,
                'total_amount' => '3000.000',
                'installments' => 12,
                'start_date' => '2026-07-01',
                // Instalments end when they are paid off, so this must not be kept.
                'end_date' => '2027-01-01',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payroll_items', [
            'calculation' => 'INSTALLMENTS',
            'total_amount' => '3000.000',
            'installments' => 12,
            'end_date' => null,
        ]);
    }

    public function test_figures_belonging_to_another_shape_are_not_kept(): void
    {
        // A percentage item that was once a fixed one must not keep the old amount lying around,
        // or a later read could price it from a figure nobody can see on the form.
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.staff-allowances.store'), [
                'user_id' => $this->person->id,
                'payroll_item_type_id' => $this->housing->id,
                'calculation' => PayrollCalculation::PERCENTAGE->value,
                'percentage' => '10.000',
                'amount' => '999.000',
                'total_amount' => '5000.000',
                'installments' => 6,
                'start_date' => '2026-01-01',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payroll_items', [
            'calculation' => 'PERCENTAGE',
            'percentage' => '10.000',
            'amount' => null,
            'total_amount' => null,
            'installments' => null,
        ]);
    }

    public function test_each_shape_demands_its_own_figures(): void
    {
        $permitted = $this->permittedUser();

        $this->actingAs($permitted)
            ->post(route('payroll.staff-allowances.store'), $this->payload(['calculation' => PayrollCalculation::FIXED->value]))
            ->assertSessionHasErrors('amount');

        $this->actingAs($permitted)
            ->post(route('payroll.staff-allowances.store'), $this->payload(['calculation' => PayrollCalculation::PERCENTAGE->value]))
            ->assertSessionHasErrors('percentage');

        $this->actingAs($permitted)
            ->post(route('payroll.staff-allowances.store'), $this->payload(['calculation' => PayrollCalculation::INSTALLMENTS->value]))
            ->assertSessionHasErrors(['total_amount', 'installments']);
    }

    public function test_a_percentage_over_a_hundred_is_refused(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.staff-allowances.store'), $this->payload([
                'calculation' => PayrollCalculation::PERCENTAGE->value,
                'percentage' => '120',
            ]))
            ->assertSessionHasErrors('percentage');
    }

    public function test_an_item_is_updated_and_removed(): void
    {
        $item = $this->item(['calculation' => PayrollCalculation::FIXED->value, 'amount' => '150.000']);

        $this->actingAs($this->permittedUser())
            ->put(route('payroll.staff-allowances.update', $item->id), [
                'user_id' => $this->person->id,
                'payroll_item_type_id' => $this->housing->id,
                'calculation' => PayrollCalculation::FIXED->value,
                'amount' => '175.000',
                'start_date' => '2026-01-01',
            ])
            ->assertRedirect();
        $this->assertSame('175.000', $item->fresh()?->amount);

        $this->actingAs($this->permittedUser())
            ->post(route('payroll.staff-allowances.destroy', $item->id), ['_method' => 'delete'])
            ->assertRedirect();
        $this->assertDatabaseMissing('payroll_items', ['id' => $item->id]);
    }

    public function test_the_same_person_can_hold_two_loans_at_once(): void
    {
        // Nothing is unique per person and type: a second loan is a normal thing to owe.
        $this->item(['calculation' => PayrollCalculation::INSTALLMENTS->value, 'total_amount' => '1000.000', 'installments' => 10, 'payroll_item_type_id' => $this->loan->id]);
        $this->item(['calculation' => PayrollCalculation::INSTALLMENTS->value, 'total_amount' => '2000.000', 'installments' => 20, 'payroll_item_type_id' => $this->loan->id]);

        $this->assertSame(2, PayrollItem::query()->count());
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'user_id' => $this->person->id,
            'payroll_item_type_id' => $this->housing->id,
            'start_date' => '2026-01-01',
            ...$overrides,
        ];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function item(array $attributes): PayrollItem
    {
        return PayrollItem::create([
            'user_id' => $this->person->id,
            'payroll_item_type_id' => $this->housing->id,
            'start_date' => '2026-01-01',
            ...$attributes,
        ]);
    }

    private function permittedUser(): User
    {
        $user = User::factory()->create();
        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
