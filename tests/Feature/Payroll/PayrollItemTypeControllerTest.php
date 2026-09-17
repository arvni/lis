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

/**
 * The catalogue of recurring allowances and deductions.
 */
class PayrollItemTypeControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = [
        'Payroll.Item Types.List Item Types',
        'Payroll.Item Types.Manage Item Types',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('payroll.item-types.index'))
            ->assertForbidden();
    }

    public function test_items_are_listed_with_their_kind(): void
    {
        PayrollItemType::create(['name' => 'Housing allowance', 'kind' => AllowanceKind::ALLOWANCE->value, 'default_amount' => '150.000']);
        PayrollItemType::create(['name' => 'Insurance', 'kind' => AllowanceKind::DEDUCTION->value]);

        $this->actingAs($this->permittedUser())
            ->get(route('payroll.item-types.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payroll/ItemTypes/Index', false)
                ->where('types.total', 2)
                ->where('types.data.0.name', 'Housing allowance')
                ->where('types.data.0.kind_label', 'Allowance')
                ->where('types.data.1.name', 'Insurance')
                ->where('types.data.1.kind', 'DEDUCTION'));
    }

    public function test_an_item_is_created_with_an_optional_default_amount(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.item-types.store'), [
                'name' => 'Transport allowance',
                'kind' => AllowanceKind::ALLOWANCE->value,
                'default_amount' => '30.500',
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payroll_item_types', [
            'name' => 'Transport allowance',
            'kind' => 'ALLOWANCE',
            'default_amount' => '30.500',
        ]);
    }

    public function test_an_item_left_without_a_default_amount_stores_nothing_rather_than_zero(): void
    {
        // Zero would print on a slip as a real amount; "no default" has to stay absent.
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.item-types.store'), [
                'name' => 'Bonus',
                'kind' => AllowanceKind::ALLOWANCE->value,
                'default_amount' => '',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payroll_item_types', ['name' => 'Bonus', 'default_amount' => null]);
    }

    public function test_names_cannot_repeat(): void
    {
        PayrollItemType::create(['name' => 'Insurance', 'kind' => AllowanceKind::DEDUCTION->value]);

        $this->actingAs($this->permittedUser())
            ->post(route('payroll.item-types.store'), [
                'name' => 'Insurance',
                'kind' => AllowanceKind::DEDUCTION->value,
            ])
            ->assertSessionHasErrors('name');
    }

    public function test_an_item_someone_still_holds_cannot_be_deleted(): void
    {
        $type = PayrollItemType::create(['name' => 'Housing allowance', 'kind' => AllowanceKind::ALLOWANCE->value]);
        PayrollItem::create([
            'user_id' => User::factory()->create()->id,
            'payroll_item_type_id' => $type->id,
            'calculation' => PayrollCalculation::FIXED->value,
            'amount' => '150.000',
            'start_date' => '2026-01-01',
        ]);

        $this->actingAs($this->permittedUser())
            ->post(route('payroll.item-types.destroy', $type->id), ['_method' => 'delete'])
            ->assertRedirect()
            ->assertSessionHas('success', false);

        // Still there: deleting it would leave the person's deduction unable to say what it was for.
        $this->assertDatabaseHas('payroll_item_types', ['id' => $type->id]);
    }

    public function test_an_unused_item_is_deleted(): void
    {
        $type = PayrollItemType::create(['name' => 'Unused', 'kind' => AllowanceKind::ALLOWANCE->value]);

        $this->actingAs($this->permittedUser())
            ->post(route('payroll.item-types.destroy', $type->id), ['_method' => 'delete'])
            ->assertRedirect();

        $this->assertDatabaseMissing('payroll_item_types', ['id' => $type->id]);
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
