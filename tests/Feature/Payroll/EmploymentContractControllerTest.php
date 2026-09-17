<?php

declare(strict_types=1);

namespace Tests\Feature\Payroll;

use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Payroll\Enums\EmploymentType;
use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class EmploymentContractControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = [
        'Payroll.Contracts.List Contracts',
        'Payroll.Contracts.Create Contract',
        'Payroll.Contracts.Edit Contract',
        'Payroll.Contracts.Delete Contract',
    ];

    private User $person;

    private LeaveKind $annual;

    private Shift $morning;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->person = User::factory()->create(['name' => 'Sara Ahmed']);
        $this->annual = LeaveKind::create(['name' => 'Annual']);
        $this->morning = Shift::create(['name' => 'Morning']);
        foreach ([0, 1, 2, 3, 4] as $weekday) {
            $this->morning->days()->create(['weekday' => $weekday, 'start_time' => '08:00', 'end_time' => '16:00']);
        }
    }

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('payroll.contracts.index'))
            ->assertForbidden();
    }

    public function test_a_contract_is_created_with_its_allowance_and_entitlement_rows(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload())
            ->assertRedirect(route('payroll.contracts.index'));

        $contract = EmploymentContract::query()->firstOrFail();
        $this->assertSame('Lab Technician', $contract->position);
        $this->assertDatabaseHas('contract_leave_entitlements', [
            'employment_contract_id' => $contract->id,
            'leave_kind_id' => $this->annual->id,
            'entitled_days' => '26.0',
        ]);
    }

    public function test_the_picked_shift_is_written_to_the_persons_shift_assignment(): void
    {
        // The contract stores no shift of its own: pay and attendance read the same assignment, so
        // overtime can never be priced against hours the person was not measured on.
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload());

        $this->assertDatabaseHas('user_shifts', [
            'user_id' => $this->person->id,
            'shift_id' => $this->morning->id,
            'effective_from' => '2026-01-01',
        ]);
        $this->assertArrayNotHasKey('shift_id', EmploymentContract::query()->firstOrFail()->getAttributes());
    }

    public function test_a_contract_can_be_saved_for_someone_with_no_shift(): void
    {
        $payload = $this->payload();
        $payload['shift_id'] = '';

        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $payload)
            ->assertRedirect(route('payroll.contracts.index'));

        $this->assertSame(1, EmploymentContract::query()->count());
        $this->assertDatabaseCount('user_shifts', 0);
    }

    public function test_saving_again_with_the_same_shift_does_not_assign_it_twice(): void
    {
        // Attendance refuses an assignment that doesn't start after the latest one, so an edit that
        // leaves the shift alone has to do nothing at all rather than try to re-assign it.
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload());
        $contract = EmploymentContract::query()->firstOrFail();

        $this->actingAs($this->permittedUser())
            ->put(route('payroll.contracts.update', $contract->id), $this->payload())
            ->assertRedirect(route('payroll.contracts.index'));

        $this->assertDatabaseCount('user_shifts', 1);
    }

    public function test_the_same_leave_kind_cannot_be_granted_twice(): void
    {
        $payload = $this->payload();
        $payload['entitlements'][] = ['leave_kind_id' => $this->annual->id, 'entitled_days' => '5'];

        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $payload)
            ->assertSessionHasErrors('entitlements.1.leave_kind_id');
    }

    public function test_a_new_contract_closes_the_one_that_was_still_running(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload(startDate: '2026-01-01'));
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload(startDate: '2026-07-01'));

        $contracts = EmploymentContract::query()->orderBy('start_date')->get();
        $this->assertCount(2, $contracts);
        // The first one is closed the day before the second begins, so the two never overlap.
        $this->assertSame('2026-06-30', $contracts[0]->end_date?->format('Y-m-d'));
        $this->assertNull($contracts[1]->end_date);
    }

    public function test_a_contract_starting_before_the_latest_one_is_refused(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload(startDate: '2026-07-01'));

        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload(startDate: '2026-03-01'))
            ->assertRedirect()
            ->assertSessionHas('success', false);

        $this->assertSame(1, EmploymentContract::query()->count());
    }

    public function test_editing_a_contract_onto_another_ones_period_is_refused(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload(startDate: '2026-01-01'));
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload(startDate: '2026-07-01'));

        $second = EmploymentContract::query()->orderByDesc('start_date')->firstOrFail();

        // Dragging the second contract's start back over the first one's run.
        $this->actingAs($this->permittedUser())
            ->put(route('payroll.contracts.update', $second->id), $this->payload(startDate: '2026-03-01'))
            ->assertRedirect()
            ->assertSessionHas('success', false);

        $this->assertSame('2026-07-01', $second->fresh()?->start_date->format('Y-m-d'));
    }

    public function test_editing_replaces_the_rows_rather_than_adding_to_them(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('payroll.contracts.store'), $this->payload());
        $contract = EmploymentContract::query()->firstOrFail();

        $payload = $this->payload();
        $payload['entitlements'] = [['leave_kind_id' => $this->annual->id, 'entitled_days' => '30']];

        $this->actingAs($this->permittedUser())
            ->put(route('payroll.contracts.update', $contract->id), $payload)
            ->assertRedirect(route('payroll.contracts.index'));

        $this->assertSame(1, $contract->entitlements()->count());
        $this->assertSame('30.0', $contract->entitlements()->firstOrFail()->entitled_days);
    }

    public function test_the_list_says_which_contracts_are_running(): void
    {
        EmploymentContract::create([
            ...$this->contractColumns(),
            'start_date' => '2020-01-01',
            'end_date' => '2020-12-31',
        ]);

        $this->actingAs($this->permittedUser())
            ->get(route('payroll.contracts.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payroll/Contracts/Index', false)
                ->where('contracts.total', 1)
                ->where('contracts.data.0.user.name', 'Sara Ahmed')
                ->where('contracts.data.0.is_current', false));
    }

    public function test_the_form_offers_the_active_shifts(): void
    {
        $this->actingAs($this->permittedUser())
            ->get(route('payroll.contracts.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payroll/Contracts/Add', false)
                ->has('shifts', 1)
                ->where('shifts.0.name', 'Morning'));
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(string $startDate = '2026-01-01'): array
    {
        return [
            ...$this->contractColumns(),
            'start_date' => $startDate,
            'end_date' => '',
            'probation_end_date' => '',
            'reference' => 'C-2026-01',
            'notes' => '',
            // Not a contract column: it is written to the person's shift assignment.
            'shift_id' => $this->morning->id,
            'entitlements' => [
                ['leave_kind_id' => $this->annual->id, 'entitled_days' => '26'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function contractColumns(): array
    {
        return [
            'user_id' => $this->person->id,
            'position' => 'Lab Technician',
            'employment_type' => EmploymentType::FULL_TIME->value,
            'base_salary' => '1200.000',
            'overtime_multiplier' => '1.25',
        ];
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
