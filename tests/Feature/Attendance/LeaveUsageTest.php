<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\Holiday;
use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * "Now" is Thursday 17 Sep 2026. The morning shift is Sunday–Thursday 08:00–16:00.
 */
class LeaveUsageTest extends TestCase
{
    use RefreshDatabase;

    private const MANAGE = 'Attendance.Leave Requests.Manage Leave Requests';

    private LeaveKind $annual;

    private LeaveKind $sick;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Carbon::setTestNow('2026-09-17 18:00:00');
        $this->annual = LeaveKind::create(['name' => 'Annual']);
        $this->sick = LeaveKind::create(['name' => 'Sick']);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_a_person_sees_the_working_days_and_hours_of_leave_used_this_year(): void
    {
        $sara = User::factory()->create(['name' => 'Sara Ahmed']);
        $this->morningShiftFor($sara);
        Holiday::create(['date' => '2026-09-15', 'title' => 'Test holiday']);
        // Thursday 10th to Sunday 20th: the 10th, 13th, 14th, 16th and today are taken; the weekends and
        // the holiday don't count; Sunday 20th is still to come.
        $this->leave($sara, $this->annual, LeaveType::DAILY, '2026-09-10', '2026-09-20', LeaveRequestStatus::APPROVED);
        // 07:00–10:00: only the two hours inside the shift count.
        $this->leave($sara, $this->annual, LeaveType::HOURLY, '2026-09-08', '2026-09-08', LeaveRequestStatus::APPROVED, '07:00', '10:00');
        // Waiting, and running into next year: only Sunday 27th to Thursday 31st are in 2026.
        $this->leave($sara, $this->sick, LeaveType::DAILY, '2026-12-27', '2027-01-02', LeaveRequestStatus::PENDING);
        // Never counted: rejected, cancelled, or in another year.
        $this->leave($sara, $this->sick, LeaveType::DAILY, '2026-09-01', '2026-09-01', LeaveRequestStatus::REJECTED);
        $this->leave($sara, $this->sick, LeaveType::DAILY, '2026-09-02', '2026-09-02', LeaveRequestStatus::CANCELLED);
        $this->leave($sara, $this->annual, LeaveType::DAILY, '2025-12-29', '2025-12-31', LeaveRequestStatus::APPROVED);

        $this->actingAs($sara)
            ->get(route('attendance.leave-usage.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/LeaveUsage/Index', false)
                ->where('view', 'person')
                ->where('year', 2026)
                ->where('person.name', 'Sara Ahmed')
                ->where('canViewOthers', false)
                ->where('staff', null)
                ->where('usage.total', $this->amounts('Total', taken: [5, 120], booked: [1, 0], pending: [5, 0]))
                ->has('usage.kinds', 2)
                ->where('usage.kinds.0', $this->amounts('Annual', taken: [5, 120], booked: [1, 0]))
                ->where('usage.kinds.1', $this->amounts('Sick', pending: [5, 0]))
                ->has('usage.requests', 3)
                ->where('usage.requests.0.start_date', '2026-09-08')
                ->where('usage.requests.0.start_time', '07:00')
                ->where('usage.requests.0.minutes', 120)
                ->where('usage.requests.1.days', 6)
                ->where('usage.requests.2.status', 'PENDING')
                ->where('usage.requests.2.days', 5));
    }

    public function test_without_a_shift_every_day_but_holidays_counts_and_hourly_leave_counts_in_full(): void
    {
        $omar = User::factory()->create();
        Holiday::create(['date' => '2026-09-15', 'title' => 'Test holiday']);
        // Friday 11th to Wednesday 16th: six days, one of them a holiday.
        $this->leave($omar, $this->annual, LeaveType::DAILY, '2026-09-11', '2026-09-16', LeaveRequestStatus::APPROVED);
        $this->leave($omar, $this->annual, LeaveType::HOURLY, '2026-09-19', '2026-09-19', LeaveRequestStatus::APPROVED, '07:00', '10:00');

        $this->actingAs($omar)
            ->get(route('attendance.leave-usage.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('usage.total', $this->amounts('Total', taken: [5, 0], booked: [0, 180])));
    }

    public function test_other_peoples_usage_and_all_staff_are_for_leave_managers(): void
    {
        $sara = User::factory()->create();
        $colleague = User::factory()->create();

        $this->actingAs($colleague)
            ->get(route('attendance.leave-usage.index', ['user_id' => $sara->id]))
            ->assertForbidden();
        $this->actingAs($colleague)
            ->get(route('attendance.leave-usage.index', ['view' => 'staff']))
            ->assertForbidden();
        $this->actingAs($colleague)
            ->get(route('attendance.leave-usage.index', ['user_id' => $colleague->id]))
            ->assertOk();

        $this->actingAs($this->manager())
            ->get(route('attendance.leave-usage.index', ['user_id' => $sara->id, 'year' => 2025]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('person.id', $sara->id)
                ->where('year', 2025)
                ->where('canViewOthers', true));
    }

    public function test_leave_managers_see_everyone_with_leave_in_the_year(): void
    {
        $sara = User::factory()->create(['name' => 'Sara Ahmed']);
        $omar = User::factory()->create(['name' => 'Omar Said']);
        User::factory()->create(['name' => 'No Leave']);
        $this->morningShiftFor($sara);
        $this->leave($sara, $this->annual, LeaveType::DAILY, '2026-09-13', '2026-09-14', LeaveRequestStatus::APPROVED);
        $this->leave($sara, $this->sick, LeaveType::HOURLY, '2026-09-22', '2026-09-22', LeaveRequestStatus::PENDING, '10:00', '12:00');
        $this->leave($omar, $this->annual, LeaveType::DAILY, '2026-10-05', '2026-10-05', LeaveRequestStatus::APPROVED);

        $this->actingAs($this->manager())
            ->get(route('attendance.leave-usage.index', ['view' => 'staff']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('view', 'staff')
                ->where('usage', null)
                ->has('staff', 2)
                ->where('staff.0.user.name', 'Omar Said')
                ->where('staff.0.booked_days', 1)
                ->where('staff.1.user.name', 'Sara Ahmed')
                ->where('staff.1.taken_days', 2)
                ->where('staff.1.pending_minutes', 120)
                ->where('staff.1.kinds.0.kind', 'Annual')
                ->where('staff.1.kinds.1.kind', 'Sick'));
    }

    public function test_the_year_must_be_a_real_year(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('attendance.leave-usage.index', ['year' => 'soon']))
            ->assertSessionHasErrors('year');
    }

    /**
     * @param  array{0: int, 1: int}  $taken  [days, minutes]
     * @param  array{0: int, 1: int}  $booked
     * @param  array{0: int, 1: int}  $pending
     * @return array<string, mixed>
     */
    private function amounts(string $kind, array $taken = [0, 0], array $booked = [0, 0], array $pending = [0, 0]): array
    {
        return [
            'kind' => $kind,
            'taken_days' => $taken[0],
            'taken_minutes' => $taken[1],
            'booked_days' => $booked[0],
            'booked_minutes' => $booked[1],
            'pending_days' => $pending[0],
            'pending_minutes' => $pending[1],
        ];
    }

    private function leave(
        User $user,
        LeaveKind $kind,
        LeaveType $type,
        string $from,
        string $to,
        LeaveRequestStatus $status,
        ?string $startTime = null,
        ?string $endTime = null,
    ): void {
        LeaveRequest::create([
            'user_id' => $user->id,
            'requested_by' => $user->id,
            'leave_kind_id' => $kind->id,
            'type' => $type,
            'start_date' => $from,
            'end_date' => $to,
            'start_time' => $startTime,
            'end_time' => $endTime,
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

    private function manager(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::MANAGE);
        $user->givePermissionTo(self::MANAGE);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
