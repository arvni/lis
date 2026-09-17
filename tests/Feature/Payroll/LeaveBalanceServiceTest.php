<?php

declare(strict_types=1);

namespace Tests\Feature\Payroll;

use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\Payroll\DTOs\LeaveBalanceLine;
use App\Domains\Payroll\Enums\EmploymentType;
use App\Domains\Payroll\Models\ContractLeaveEntitlement;
use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\Payroll\Services\LeaveBalanceService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Entitlement is a fixed total for the contract's whole run, so the balance is counted over that
 * run rather than a calendar year.
 *
 * "Now" is Thursday 17 Sep 2026. The person works the morning shift, Sunday–Thursday 08:00–16:00,
 * so one of their working days is 480 minutes — that figure comes from the shift, never from the
 * contract. Every leave date below falls on a working day.
 */
class LeaveBalanceServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $person;

    private LeaveKind $annual;

    private LeaveBalanceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-09-17 09:00:00');
        $this->person = User::factory()->create();
        $this->annual = LeaveKind::create(['name' => 'Annual']);
        $this->service = app(LeaveBalanceService::class);
        $this->morningShiftFor($this->person);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_an_untouched_allowance_is_entirely_remaining(): void
    {
        $contract = $this->contractGranting('26');

        $line = $this->lineFor($contract);
        $this->assertSame(480, $line->dailyMinutes);
        $this->assertSame(12480, $line->entitledMinutes());
        $this->assertSame(0, $line->totalUsedMinutes());
        $this->assertSame(12480, $line->remainingMinutes());
    }

    public function test_leave_already_taken_and_leave_booked_ahead_both_come_off(): void
    {
        $contract = $this->contractGranting('26');
        // Two days already taken.
        $this->leave('2026-09-07', '2026-09-08', LeaveRequestStatus::APPROVED);
        // One day booked for later in the contract: the allowance is spent either way.
        $this->leave('2026-11-02', '2026-11-02', LeaveRequestStatus::APPROVED);

        $line = $this->lineFor($contract);
        $this->assertSame(3, $line->usedDays);
        $this->assertSame(1440, $line->totalUsedMinutes());
        $this->assertSame(11040, $line->remainingMinutes());
    }

    public function test_a_request_still_waiting_is_reported_but_not_subtracted(): void
    {
        $contract = $this->contractGranting('26');
        $this->leave('2026-10-05', '2026-10-06', LeaveRequestStatus::PENDING);

        $line = $this->lineFor($contract);
        // Nothing is used until it is approved, but the figure is still worth seeing.
        $this->assertSame(0, $line->totalUsedMinutes());
        $this->assertSame(2, $line->pendingDays);
        $this->assertSame(12480, $line->remainingMinutes());
    }

    public function test_hourly_leave_comes_off_in_minutes(): void
    {
        $contract = $this->contractGranting('26');
        LeaveRequest::create([
            'user_id' => $this->person->id,
            'requested_by' => $this->person->id,
            'leave_kind_id' => $this->annual->id,
            'type' => LeaveType::HOURLY,
            'start_date' => '2026-09-09',
            'end_date' => '2026-09-09',
            'start_time' => '09:00',
            'end_time' => '11:30',
            'status' => LeaveRequestStatus::APPROVED,
        ]);

        $line = $this->lineFor($contract);
        $this->assertSame(0, $line->usedDays);
        $this->assertSame(150, $line->usedMinutes);
        $this->assertSame(150, $line->totalUsedMinutes());
    }

    public function test_taking_more_than_the_contract_grants_shows_as_overdrawn(): void
    {
        $contract = $this->contractGranting('1');
        $this->leave('2026-09-07', '2026-09-09', LeaveRequestStatus::APPROVED);

        $line = $this->lineFor($contract);
        $this->assertTrue($line->isOverdrawn());
        $this->assertSame(-960, $line->remainingMinutes());
    }

    public function test_a_longer_working_day_makes_the_same_allowance_worth_more_hours(): void
    {
        // Four 10-hour days a week: a day of leave is 600 minutes, not 480. The figure follows the
        // shift, which is the whole point of taking it from there.
        UserShift::query()->where('user_id', $this->person->id)->delete();
        $shift = Shift::create(['name' => 'Long days']);
        foreach ([0, 1, 2, 3] as $weekday) {
            $shift->days()->create(['weekday' => $weekday, 'start_time' => '08:00', 'end_time' => '18:00']);
        }
        UserShift::create(['user_id' => $this->person->id, 'shift_id' => $shift->id, 'effective_from' => '2026-01-01']);

        $line = $this->lineFor($this->contractGranting('10'));
        $this->assertSame(600, $line->dailyMinutes);
        $this->assertSame(6000, $line->entitledMinutes());
    }

    public function test_without_a_shift_the_balance_is_reported_in_days_only(): void
    {
        // Nothing says how long one of their days is, so days and hours are not added together.
        UserShift::query()->where('user_id', $this->person->id)->delete();
        $contract = $this->contractGranting('26');
        $this->leave('2026-09-07', '2026-09-08', LeaveRequestStatus::APPROVED);

        $line = $this->lineFor($contract);
        $this->assertNull($line->dailyMinutes);
        $this->assertNull($line->entitledMinutes());
        $this->assertNull($line->remainingMinutes());
        $this->assertSame(2, $line->usedDays);
        $this->assertSame(24.0, $line->remainingDays());
        $this->assertFalse($line->isOverdrawn());
    }

    public function test_leave_of_a_kind_the_contract_grants_nothing_for_still_shows(): void
    {
        $contract = $this->contractGranting('26');
        $sick = LeaveKind::create(['name' => 'Sick']);
        LeaveRequest::create([
            'user_id' => $this->person->id,
            'requested_by' => $this->person->id,
            'leave_kind_id' => $sick->id,
            'type' => LeaveType::DAILY,
            'start_date' => '2026-09-14',
            'end_date' => '2026-09-14',
            'status' => LeaveRequestStatus::APPROVED,
        ]);

        $lines = $this->service->forContract($contract->load('entitlements.kind'))->lines;
        $this->assertCount(2, $lines);
        // Sorted by kind name, and the ungranted kind reads as overdrawn rather than vanishing.
        $this->assertSame('Sick', $lines[1]->kindName);
        $this->assertSame('0.0', $lines[1]->entitledDays);
        $this->assertSame(-480, $lines[1]->remainingMinutes());
    }

    public function test_unpaid_leave_in_a_period_is_reported_for_the_slip(): void
    {
        $this->contractGranting('26');
        $unpaid = LeaveKind::create(['name' => 'Unpaid', 'is_paid' => false]);
        LeaveRequest::create([
            'user_id' => $this->person->id,
            'requested_by' => $this->person->id,
            'leave_kind_id' => $unpaid->id,
            'type' => LeaveType::DAILY,
            'start_date' => '2026-09-14',
            'end_date' => '2026-09-15',
            'status' => LeaveRequestStatus::APPROVED,
        ]);
        // Paid leave in the same month must not be deducted.
        $this->leave('2026-09-07', '2026-09-07', LeaveRequestStatus::APPROVED);

        $this->assertSame(
            ['days' => 2, 'minutes' => 0],
            $this->service->unpaidLeaveIn($this->person->id, '2026-09-01', '2026-09-30'),
        );
    }

    private function lineFor(EmploymentContract $contract): LeaveBalanceLine
    {
        return $this->service->forContract($contract->load('entitlements.kind'))->lines[0];
    }

    private function contractGranting(string $days): EmploymentContract
    {
        $contract = EmploymentContract::create([
            'user_id' => $this->person->id,
            'employment_type' => EmploymentType::FULL_TIME->value,
            'base_salary' => '1200.000',
            'overtime_multiplier' => '1.25',
            'start_date' => '2026-01-01',
        ]);
        ContractLeaveEntitlement::create([
            'employment_contract_id' => $contract->id,
            'leave_kind_id' => $this->annual->id,
            'entitled_days' => $days,
        ]);

        return $contract;
    }

    private function leave(string $from, string $to, LeaveRequestStatus $status): void
    {
        LeaveRequest::create([
            'user_id' => $this->person->id,
            'requested_by' => $this->person->id,
            'leave_kind_id' => $this->annual->id,
            'type' => LeaveType::DAILY,
            'start_date' => $from,
            'end_date' => $to,
            'status' => $status,
        ]);
    }

    private function morningShiftFor(User $person): void
    {
        $shift = Shift::create(['name' => 'Morning']);
        foreach ([0, 1, 2, 3, 4] as $weekday) {
            $shift->days()->create(['weekday' => $weekday, 'start_time' => '08:00', 'end_time' => '16:00']);
        }
        UserShift::create(['user_id' => $person->id, 'shift_id' => $shift->id, 'effective_from' => '2026-01-01']);
    }
}
