<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\AttendanceDay;
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
 * "Now" is Thursday 17 Sep 2026; September 2026 starts on a Tuesday.
 */
class AttendanceCalendarControllerTest extends TestCase
{
    use RefreshDatabase;

    private const LIST = 'Attendance.Daily Attendance.List Attendance';

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Carbon::setTestNow('2026-09-17 18:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_everyone_sees_their_own_calendar_for_this_month_by_default(): void
    {
        $sara = User::factory()->create(['name' => 'Sara Ahmed']);

        $this->actingAs($sara)
            ->get(route('attendance.calendar.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/Calendar/Index', false)
                ->where('person.id', $sara->id)
                ->where('calendar.month', '2026-09')
                ->where('calendar.label', 'September 2026')
                ->has('calendar.days', 30)
                ->where('calendar.days.0.weekday', 'Tue')
                ->where('calendar.days.16.is_today', true)
                ->where('canViewOthers', false));
    }

    public function test_other_peoples_calendars_need_the_attendance_permission(): void
    {
        $sara = User::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('attendance.calendar.index', ['user_id' => $sara->id]))
            ->assertForbidden();

        $this->actingAs($this->viewer())
            ->get(route('attendance.calendar.index', ['user_id' => $sara->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('person.id', $sara->id)
                ->where('canViewOthers', true));
    }

    public function test_a_month_shows_shift_hours_holidays_leave_and_what_was_recorded(): void
    {
        $sara = User::factory()->create();
        $shift = Shift::create(['name' => 'Morning']);
        foreach ([0, 1, 2, 3, 4] as $weekday) {
            $shift->days()->create(['weekday' => $weekday, 'start_time' => '08:00', 'end_time' => '16:00']);
        }
        UserShift::create(['user_id' => $sara->id, 'shift_id' => $shift->id, 'effective_from' => '2026-09-01']);
        Holiday::create(['date' => '2026-09-15', 'title' => 'Test holiday']);
        $annual = LeaveKind::create(['name' => 'Annual']);
        $this->leave($sara, $annual, LeaveType::DAILY, '2026-09-21', '2026-09-22', LeaveRequestStatus::APPROVED);
        $this->leave($sara, $annual, LeaveType::HOURLY, '2026-09-24', '2026-09-24', LeaveRequestStatus::PENDING, '10:00', '12:00');
        $this->leave($sara, $annual, LeaveType::DAILY, '2026-09-27', '2026-09-27', LeaveRequestStatus::REJECTED);
        $this->day($sara, '2026-09-14', AttendanceStatus::PRESENT, [
            'check_in' => '2026-09-14 08:11:04',
            'check_out' => '2026-09-14 15:47:52',
            'late_minutes' => 11,
            'early_leave_minutes' => 12,
            'worked_minutes' => 456,
        ]);
        $this->day($sara, '2026-09-16', AttendanceStatus::ABSENT);

        $this->actingAs($sara)
            ->get(route('attendance.calendar.index', ['month' => '2026-09']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                // Tuesday 1st: a working day.
                ->where('calendar.days.0.shift.name', 'Morning')
                ->where('calendar.days.0.scheduled_start', '08:00')
                ->where('calendar.days.0.scheduled_minutes', 480)
                // Friday 4th: day off.
                ->where('calendar.days.3.scheduled_start', null)
                ->where('calendar.days.3.scheduled_minutes', 0)
                // Monday 14th: recorded.
                ->where('calendar.days.13.attendance.status', 'PRESENT')
                ->where('calendar.days.13.attendance.check_in', '08:11')
                ->where('calendar.days.13.attendance.worked_minutes', 456)
                // Tuesday 15th: holiday, nothing scheduled.
                ->where('calendar.days.14.holiday', 'Test holiday')
                ->where('calendar.days.14.scheduled_minutes', 0)
                ->where('calendar.days.15.attendance.status', 'ABSENT')
                // Monday 21st: approved leave; Thursday 24th: pending hourly leave; 27th: rejected leave isn't shown.
                ->where('calendar.days.20.leaves.0.kind', 'Annual')
                ->where('calendar.days.20.leaves.0.status', 'APPROVED')
                ->where('calendar.days.23.leaves.0.status', 'PENDING')
                ->where('calendar.days.23.leaves.0.start_time', '10:00')
                ->has('calendar.days.26.leaves', 0)
                ->where('calendar.days.25.is_future', true)
                // 22 working days (Sunday–Thursday) minus the holiday, 8 hours each.
                ->where('calendar.totals.scheduled_minutes', 21 * 480)
                ->where('calendar.totals.worked_minutes', 456)
                ->where('calendar.totals.late_minutes', 11)
                ->where('calendar.totals.early_leave_minutes', 12)
                ->where('calendar.totals.present_days', 1)
                ->where('calendar.totals.absent_days', 1));
    }

    public function test_the_month_must_be_a_real_month(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('attendance.calendar.index', ['month' => '2026-13']))
            ->assertSessionHasErrors('month');
    }

    public function test_only_attendance_viewers_can_search_for_people(): void
    {
        User::factory()->create(['name' => 'Sara Ahmed']);

        $this->actingAs(User::factory()->create())
            ->getJson(route('api.attendance.calendar-people.list'))
            ->assertForbidden();

        $this->actingAs($this->viewer())
            ->getJson(route('api.attendance.calendar-people.list', ['search' => 'Sara']))
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Sara Ahmed');
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

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function day(User $user, string $date, AttendanceStatus $status, array $attributes = []): void
    {
        AttendanceDay::create(array_merge([
            'user_id' => $user->id,
            'date' => $date,
            'scheduled_start' => '08:00:00',
            'scheduled_end' => '16:00:00',
            'status' => $status,
        ], $attributes));
    }

    private function viewer(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::LIST);
        $user->givePermissionTo(self::LIST);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
