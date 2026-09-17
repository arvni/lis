<?php

declare(strict_types=1);

namespace Tests\Feature\Payroll;

use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\Payroll\Enums\AllowanceKind;
use App\Domains\Payroll\Enums\EmploymentType;
use App\Domains\Payroll\Enums\PayrollCalculation;
use App\Domains\Payroll\Enums\SalarySlipStatus;
use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Payroll\Models\PayrollItemType;
use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Slips are prepared under permission, edited, then issued to the person they belong to.
 *
 * "Now" is Thursday 17 Sep 2026. The person works the morning shift, Sunday–Thursday 08:00–16:00,
 * so a working day is 480 minutes. No punches are recorded, so there is no overtime or absence to
 * price and a slip is the salary plus whatever their own items come to.
 */
class SalarySlipTest extends TestCase
{
    use RefreshDatabase;

    private const MANAGE = 'Payroll.Salary Slips.Manage Salary Slips';

    private const ISSUE = 'Payroll.Salary Slips.Issue Salary Slips';

    private User $person;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Carbon::setTestNow('2026-09-17 09:00:00');
        $this->person = User::factory()->create(['name' => 'Sara Ahmed']);
        $this->morningShift();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_generating_requires_permission(): void
    {
        $this->contract();

        $this->actingAs(User::factory()->create())
            ->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-09'])
            ->assertForbidden();
    }

    public function test_a_draft_is_generated_from_the_contract_and_the_persons_items(): void
    {
        $this->contract();
        $this->fixedItem('Housing allowance', AllowanceKind::ALLOWANCE, '150.000');
        $this->percentageItem('Insurance', '5.000');

        $this->actingAs($this->payrollUser())
            ->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-09'])
            ->assertRedirect();

        $slip = SalarySlip::query()->firstOrFail();
        $this->assertSame(SalarySlipStatus::DRAFT, $slip->status);
        $this->assertNull($slip->number, 'a draft is not numbered');
        $this->assertSame('1290.000', (string) $slip->net);
        // The terms are copied on, so a later contract change cannot rewrite what this says.
        $this->assertSame('1200.000', (string) $slip->basic_salary);
        $this->assertSame(480, $slip->working_day_minutes);
        $this->assertCount(3, $slip->lines);
    }

    public function test_the_same_month_cannot_be_generated_twice(): void
    {
        $this->contract();
        $payroll = $this->payrollUser();

        $this->actingAs($payroll)->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-09']);
        $this->actingAs($payroll)
            ->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-09'])
            ->assertRedirect()
            ->assertSessionHas('success', false);

        $this->assertSame(1, SalarySlip::query()->count());
    }

    public function test_a_month_with_no_contract_cannot_be_generated(): void
    {
        $this->contract(startDate: '2026-01-01', endDate: '2026-03-31');

        $this->actingAs($this->payrollUser())
            ->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-09'])
            ->assertRedirect()
            ->assertSessionHas('success', false);

        $this->assertSame(0, SalarySlip::query()->count());
    }

    public function test_issuing_numbers_the_slip_and_needs_its_own_permission(): void
    {
        $slip = $this->draft();

        // Preparing a slip and releasing it are separate jobs.
        $this->actingAs($this->payrollUser())
            ->put(route('payroll.salary-slips.issue', $slip->id))
            ->assertForbidden();

        $this->actingAs($this->issuer())
            ->put(route('payroll.salary-slips.issue', $slip->id))
            ->assertRedirect();

        $slip->refresh();
        $this->assertSame(SalarySlipStatus::ISSUED, $slip->status);
        $this->assertSame('SLP-2026-0001', $slip->number);
        $this->assertNotNull($slip->issued_at);
    }

    public function test_an_employee_sees_their_issued_slip_but_never_a_draft(): void
    {
        $slip = $this->draft();

        // Nobody's business but payroll's until it is released.
        $this->actingAs($this->person)
            ->get(route('payroll.salary-slips.show', $slip->id))
            ->assertForbidden();

        $this->actingAs($this->issuer())->put(route('payroll.salary-slips.issue', $slip->id));

        $this->actingAs($this->person)
            ->get(route('payroll.salary-slips.show', $slip->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payroll/SalarySlips/Show', false)
                ->where('canEdit', false)
                ->where('canIssue', false)
                ->where('slip.number', 'SLP-2026-0001'));
    }

    public function test_someone_elses_slip_stays_out_of_reach(): void
    {
        $slip = $this->draft();
        $this->actingAs($this->issuer())->put(route('payroll.salary-slips.issue', $slip->id));

        $this->actingAs(User::factory()->create())
            ->get(route('payroll.salary-slips.show', $slip->id))
            ->assertForbidden();
    }

    public function test_the_list_shows_a_person_only_their_own_issued_slips(): void
    {
        $slip = $this->draft();

        $this->actingAs($this->person)
            ->get(route('payroll.salary-slips.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canViewAll', false)
                ->where('canManage', false)
                ->where('slips.total', 0));

        $this->actingAs($this->issuer())->put(route('payroll.salary-slips.issue', $slip->id));

        $this->actingAs($this->person)
            ->get(route('payroll.salary-slips.index'))
            ->assertInertia(fn (Assert $page) => $page->where('slips.total', 1));
    }

    public function test_lines_can_be_edited_and_the_net_is_re_added(): void
    {
        $slip = $this->draft();

        $this->actingAs($this->payrollUser())
            ->put(route('payroll.salary-slips.update', $slip->id), [
                'lines' => [
                    ['code' => 'BASE', 'label' => 'Base salary', 'amount' => '1200.000'],
                    ['code' => 'ITEM', 'label' => 'Bonus', 'amount' => '75.500'],
                ],
                'notes' => 'Includes a one-off bonus',
            ])
            ->assertRedirect();

        $slip->refresh();
        $this->assertSame('1275.500', (string) $slip->net);
        $this->assertSame('Includes a one-off bonus', $slip->notes);
        $this->assertCount(2, $slip->lines);
    }

    public function test_a_loan_advances_only_when_a_slip_is_issued(): void
    {
        $this->contract();
        $this->loanItem('Loan', '3000.000', 12, '2026-07-01');
        $payroll = $this->payrollUser();
        $issuer = $this->issuer();

        // July: the first instalment, issued.
        $this->actingAs($payroll)->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-07']);
        $july = SalarySlip::query()->firstOrFail();
        $this->assertSame(1, $july->lines()->whereNotNull('installment_number')->firstOrFail()->installment_number);
        $this->actingAs($issuer)->put(route('payroll.salary-slips.issue', $july->id));

        // August: drafted but never issued, so it must not move the loan on.
        $this->actingAs($payroll)->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-08']);

        // September is therefore the second instalment, not the third.
        $this->actingAs($payroll)->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-09']);
        $september = SalarySlip::query()->where('period_from', '2026-09-01')->firstOrFail();
        $line = $september->lines()->whereNotNull('installment_number')->firstOrFail();

        $this->assertSame(2, $line->installment_number);
        $this->assertSame('instalment 2 of 12 · 2,500.000 remaining', $line->note);
    }

    public function test_a_loan_behind_the_calendar_is_warned_about_but_still_generated(): void
    {
        $this->contract();
        $this->loanItem('Loan', '3000.000', 12, '2026-07-01');
        $payroll = $this->payrollUser();

        // July issued, August and September never drafted at all.
        $this->actingAs($payroll)->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-07']);
        $this->actingAs($this->issuer())->put(route('payroll.salary-slips.issue', SalarySlip::query()->firstOrFail()->id));

        // October is the fourth month since the loan began, but only one instalment has gone out.
        $this->actingAs($payroll)
            ->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-10'])
            ->assertRedirect()
            ->assertSessionHas('success', true)
            ->assertSessionHas('slipWarnings', fn (array $warnings) => count($warnings) === 1
                && str_contains($warnings[0], 'Loan is on instalment 2 of 12, but this is month 4')
                && str_contains($warnings[0], '2 earlier month(s) have no issued slip'));

        // Warned, not refused: the slip exists and the loan is genuinely on its second instalment.
        $october = SalarySlip::query()->where('period_from', '2026-10-01')->firstOrFail();
        $this->assertSame(2, $october->lines()->whereNotNull('installment_number')->firstOrFail()->installment_number);
    }

    public function test_a_loan_in_step_with_the_calendar_warns_about_nothing(): void
    {
        $this->contract();
        $this->loanItem('Loan', '3000.000', 12, '2026-09-01');

        $this->actingAs($this->payrollUser())
            ->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-09'])
            ->assertSessionHas('slipWarnings', []);
    }

    public function test_an_issued_slip_cannot_be_deleted(): void
    {
        $slip = $this->draft();
        $this->actingAs($this->issuer())->put(route('payroll.salary-slips.issue', $slip->id));

        // The employee has seen it; removing it would leave them holding a document nothing
        // corroborates.
        $this->actingAs($this->payrollUser())
            ->delete(route('payroll.salary-slips.destroy', $slip->id))
            ->assertForbidden();
    }

    private function draft(): SalarySlip
    {
        $this->contract();
        $this->actingAs($this->payrollUser())
            ->post(route('payroll.salary-slips.store'), ['user_id' => $this->person->id, 'month' => '2026-09']);

        return SalarySlip::query()->firstOrFail();
    }

    private function contract(string $startDate = '2026-01-01', ?string $endDate = null): EmploymentContract
    {
        return EmploymentContract::create([
            'user_id' => $this->person->id,
            'position' => 'Lab Technician',
            'employment_type' => EmploymentType::FULL_TIME->value,
            'base_salary' => '1200.000',
            'overtime_multiplier' => '1.25',
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }

    private function fixedItem(string $name, AllowanceKind $kind, string $amount): void
    {
        $this->payrollItem($name, $kind, [
            'calculation' => PayrollCalculation::FIXED->value,
            'amount' => $amount,
            'start_date' => '2026-01-01',
        ]);
    }

    private function percentageItem(string $name, string $percentage): void
    {
        $this->payrollItem($name, AllowanceKind::DEDUCTION, [
            'calculation' => PayrollCalculation::PERCENTAGE->value,
            'percentage' => $percentage,
            'start_date' => '2026-01-01',
        ]);
    }

    private function loanItem(string $name, string $total, int $installments, string $start): void
    {
        $this->payrollItem($name, AllowanceKind::DEDUCTION, [
            'calculation' => PayrollCalculation::INSTALLMENTS->value,
            'total_amount' => $total,
            'installments' => $installments,
            'start_date' => $start,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function payrollItem(string $name, AllowanceKind $kind, array $attributes): void
    {
        $type = PayrollItemType::create(['name' => $name, 'kind' => $kind->value]);
        PayrollItem::create([
            ...$attributes,
            'user_id' => $this->person->id,
            'payroll_item_type_id' => $type->id,
        ]);
    }

    private function morningShift(): void
    {
        $shift = Shift::create(['name' => 'Morning']);
        foreach ([0, 1, 2, 3, 4] as $weekday) {
            $shift->days()->create(['weekday' => $weekday, 'start_time' => '08:00', 'end_time' => '16:00']);
        }
        UserShift::create([
            'user_id' => $this->person->id,
            'shift_id' => $shift->id,
            'effective_from' => '2026-01-01',
        ]);
    }

    private function payrollUser(): User
    {
        return $this->userWith([self::MANAGE]);
    }

    private function issuer(): User
    {
        return $this->userWith([self::MANAGE, self::ISSUE]);
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
}
