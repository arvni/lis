<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Models\Holiday;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * `attendance:process` end to end: punches as HikCentral writes them, shifts, holidays, and the
 * recalculation that holiday and shift changes trigger. "Now" is Thursday 17 Sep 2026, 18:00.
 */
class AttendanceProcessingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-09-17 18:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_recent_days_are_built_from_punches_shifts_and_holidays(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $shift = $this->sundayToThursdayShift();
        $this->assign($sara, $shift, '2026-09-01');
        Holiday::create(['date' => '2026-09-15', 'title' => 'Test holiday']);

        $this->punch('00123', '2026-09-13T08:00:00'); // before the default window
        $this->punch('00123', '2026-09-14T08:11:04');
        $this->punch('00123', '2026-09-14T12:02:40');
        $this->punch('00123', '2026-09-14T15:47:52');
        $this->punch('00123', '2026-09-15T09:00:00');
        $this->punch('00123', '2026-09-16T08:05:00');

        $this->artisan('attendance:process')->assertSuccessful();

        $monday = $this->day($sara, '2026-09-14');
        $this->assertSame(AttendanceStatus::PRESENT, $monday?->status);
        $this->assertSame($shift->id, $monday->shift_id);
        $this->assertSame('08:00:00', $monday->scheduled_start);
        $this->assertSame('2026-09-14 08:11:04', $monday->check_in?->format('Y-m-d H:i:s'));
        $this->assertSame('2026-09-14 15:47:52', $monday->check_out?->format('Y-m-d H:i:s'));
        $this->assertSame(11, $monday->late_minutes);
        $this->assertSame(12, $monday->early_leave_minutes);
        $this->assertSame(456, $monday->worked_minutes);
        $this->assertFalse($monday->is_manual);

        $this->assertSame(AttendanceStatus::HOLIDAY, $this->day($sara, '2026-09-15')?->status);
        $this->assertSame(AttendanceStatus::INCOMPLETE, $this->day($sara, '2026-09-16')?->status);
        $this->assertSame(5, $this->day($sara, '2026-09-16')?->late_minutes);
        $this->assertSame(AttendanceStatus::ABSENT, $this->day($sara, '2026-09-17')?->status);

        $this->assertNull($this->day($sara, '2026-09-13'));
        $this->assertNull($this->day($sara, '2026-09-18'));
    }

    public function test_weekdays_without_hours_are_days_off_for_people_with_a_shift(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $this->assign($sara, $this->sundayToThursdayShift(), '2026-09-01');

        $this->artisan('attendance:process', ['--from' => '2026-09-11', '--to' => '2026-09-12'])->assertSuccessful();

        $this->assertSame(AttendanceStatus::OFF, $this->day($sara, '2026-09-11')?->status);
        $this->assertSame(AttendanceStatus::OFF, $this->day($sara, '2026-09-12')?->status);
    }

    public function test_people_without_a_shift_only_get_the_days_they_punched(): void
    {
        $visitor = User::factory()->create(['attendance_number' => '00456']);
        $absentee = User::factory()->create(['attendance_number' => '00789']);
        $this->punch('00456', '2026-09-16T10:00:00');
        $this->punch('00456', '2026-09-16T12:00:00');
        $this->punch('55555', '2026-09-16T09:00:00'); // nobody in the LIS has this Employee ID

        $this->artisan('attendance:process')->assertSuccessful();

        $day = $this->day($visitor, '2026-09-16');
        $this->assertSame(AttendanceStatus::OFF, $day?->status);
        $this->assertNull($day->shift_id);
        $this->assertSame(120, $day->worked_minutes);
        $this->assertSame(0, AttendanceDay::query()->where('user_id', $absentee->id)->count());
        $this->assertSame(1, AttendanceDay::query()->count());
    }

    public function test_running_again_changes_nothing_and_keeps_corrected_days(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $this->assign($sara, $this->sundayToThursdayShift(), '2026-09-01');
        $this->punch('00123', '2026-09-14T08:11:04');
        $this->punch('00123', '2026-09-14T15:47:52');

        $this->artisan('attendance:process')->assertSuccessful();
        $this->assertSame(4, AttendanceDay::query()->count());

        $this->day($sara, '2026-09-14')?->update([
            'check_in' => '2026-09-14 08:00:00',
            'late_minutes' => 0,
            'is_manual' => true,
            'note' => 'Card reader was down',
        ]);
        $this->punch('00123', '2026-09-14T17:30:00');

        $this->artisan('attendance:process')->assertSuccessful();

        $corrected = $this->day($sara, '2026-09-14');
        $this->assertTrue($corrected?->is_manual);
        $this->assertSame(0, $corrected->late_minutes);
        $this->assertSame('2026-09-14 15:47:52', $corrected->check_out?->format('Y-m-d H:i:s'));
        $this->assertSame(4, AttendanceDay::query()->count());
    }

    public function test_days_that_no_longer_apply_are_removed_but_corrected_ones_stay(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $assignment = $this->assign($sara, $this->sundayToThursdayShift(), '2026-09-01');

        $this->artisan('attendance:process')->assertSuccessful();
        $this->day($sara, '2026-09-16')?->update(['is_manual' => true, 'note' => 'Working from the branch']);

        $assignment->delete();
        $this->artisan('attendance:process')->assertSuccessful();

        $this->assertSame(1, AttendanceDay::query()->count());
        $this->assertTrue($this->day($sara, '2026-09-16')?->is_manual);
    }

    public function test_only_the_named_people_and_dates_are_processed(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $omar = User::factory()->create(['attendance_number' => '00456']);
        $shift = $this->sundayToThursdayShift();
        $this->assign($sara, $shift, '2026-09-01');
        $this->assign($omar, $shift, '2026-09-01');

        $this->artisan('attendance:process', ['--from' => '2026-09-14', '--to' => '2026-09-14', '--user' => [$sara->id]])
            ->assertSuccessful();

        $this->assertSame(1, AttendanceDay::query()->count());
        $this->assertNotNull($this->day($sara, '2026-09-14'));
    }

    public function test_adding_a_holiday_for_a_past_date_recalculates_that_day(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $this->assign($sara, $this->sundayToThursdayShift(), '2026-09-01');
        $this->artisan('attendance:process')->assertSuccessful();
        $this->assertSame(AttendanceStatus::ABSENT, $this->day($sara, '2026-09-16')?->status);

        $this->actingAs($this->userWith('Attendance.Holidays.Create Holiday'))
            ->post(route('attendance.holidays.store'), ['date' => '2026-09-16', 'title' => 'Prophet’s Birthday'])
            ->assertSessionHasNoErrors();

        $this->assertSame(AttendanceStatus::HOLIDAY, $this->day($sara, '2026-09-16')?->status);
    }

    public function test_removing_a_holiday_recalculates_that_day(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $this->assign($sara, $this->sundayToThursdayShift(), '2026-09-01');
        $holiday = Holiday::create(['date' => '2026-09-16', 'title' => 'Prophet’s Birthday']);
        $this->artisan('attendance:process')->assertSuccessful();
        $this->assertSame(AttendanceStatus::HOLIDAY, $this->day($sara, '2026-09-16')?->status);

        $this->actingAs($this->userWith('Attendance.Holidays.Delete Holiday'))
            ->delete(route('attendance.holidays.destroy', $holiday->id))
            ->assertRedirect();

        $this->assertSame(AttendanceStatus::ABSENT, $this->day($sara, '2026-09-16')?->status);
    }

    public function test_a_back_dated_shift_assignment_recalculates_that_persons_days(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $this->punch('00123', '2026-09-14T08:11:04');
        $this->punch('00123', '2026-09-14T15:47:52');
        $this->artisan('attendance:process')->assertSuccessful();
        $this->assertSame(AttendanceStatus::OFF, $this->day($sara, '2026-09-14')?->status);

        $this->actingAs($this->userWith('Attendance.Shift Assignments.Manage Shift Assignments'))
            ->postJson(route('api.attendance.users.shift-assignments.store', $sara), [
                'shift_id' => $this->sundayToThursdayShift()->id,
                'effective_from' => '2026-09-14',
            ])
            ->assertCreated();

        $this->assertSame(AttendanceStatus::PRESENT, $this->day($sara, '2026-09-14')?->status);
        $this->assertSame(11, $this->day($sara, '2026-09-14')?->late_minutes);
        $this->assertSame(AttendanceStatus::ABSENT, $this->day($sara, '2026-09-17')?->status);
    }

    private function sundayToThursdayShift(): Shift
    {
        $shift = Shift::create(['name' => 'Morning '.uniqid()]);
        foreach ([0, 1, 2, 3, 4] as $weekday) {
            $shift->days()->create(['weekday' => $weekday, 'start_time' => '08:00', 'end_time' => '16:00']);
        }

        return $shift;
    }

    private function assign(User $user, Shift $shift, string $from): UserShift
    {
        return UserShift::create(['user_id' => $user->id, 'shift_id' => $shift->id, 'effective_from' => $from]);
    }

    /**
     * Insert a punch exactly as HikCentral writes it: its "T" datetime plus the split date and time.
     */
    private function punch(string $attendanceId, string $accessDateAndTime): void
    {
        [$date, $time] = explode('T', $accessDateAndTime);

        DB::table('attendance_transactions')->insert([
            'attendance_id' => $attendanceId,
            'access_date_and_time' => $accessDateAndTime,
            'access_date' => $date,
            'access_time' => $time,
        ]);
    }

    private function day(User $user, string $date): ?AttendanceDay
    {
        return AttendanceDay::query()->where('user_id', $user->id)->whereDate('date', $date)->first();
    }

    private function userWith(string $permission): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate($permission);
        $user->givePermissionTo($permission);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
