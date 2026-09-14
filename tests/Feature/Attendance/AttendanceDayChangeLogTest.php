<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Enums\AttendanceChangeAction;
use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Models\AttendanceDayChange;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AttendanceDayChangeLogTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_every_correction_is_logged_with_the_values_before_and_after(): void
    {
        $sara = User::factory()->create();
        $day = $this->makeDay($sara, '2026-09-15', AttendanceStatus::ABSENT);
        $editor = $this->userWith('Attendance.Daily Attendance.Correct Attendance');

        $this->actingAs($editor)
            ->put(route('attendance.days.update', $day->id), ['check_in' => '08:20', 'check_out' => '16:00', 'note' => 'Forgot their card'])
            ->assertSessionHasNoErrors();
        $this->actingAs($editor)
            ->put(route('attendance.days.update', $day->id), ['check_in' => '08:00', 'check_out' => '16:00', 'note' => 'Checked the camera'])
            ->assertSessionHasNoErrors();

        $changes = AttendanceDayChange::query()->orderBy('id')->get();
        $this->assertCount(2, $changes);

        [$first, $second] = [$changes[0], $changes[1]];
        $this->assertSame(AttendanceChangeAction::CORRECTED, $first->action);
        $this->assertSame($day->id, $first->attendance_day_id);
        $this->assertSame($sara->id, $first->user_id);
        $this->assertSame('2026-09-15', $first->date->format('Y-m-d'));
        $this->assertSame($editor->id, $first->changed_by);
        $this->assertSame('Forgot their card', $first->note);
        $this->assertNull($first->before['check_in']);
        $this->assertSame('ABSENT', $first->before['status']);
        $this->assertSame('08:20:00', $first->after['check_in']);
        $this->assertSame('PRESENT', $first->after['status']);
        $this->assertSame(20, $first->after['late_minutes']);
        $this->assertSame(460, $first->after['worked_minutes']);

        $this->assertSame('08:20:00', $second->before['check_in']);
        $this->assertSame('08:00:00', $second->after['check_in']);
        $this->assertSame(0, $second->after['late_minutes']);
    }

    public function test_recalculating_a_corrected_day_from_the_punches_is_logged(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $shift = Shift::create(['name' => 'Morning']);
        $shift->days()->create(['weekday' => 1, 'start_time' => '08:00', 'end_time' => '16:00']);
        UserShift::create(['user_id' => $sara->id, 'shift_id' => $shift->id, 'effective_from' => '2026-09-01']);
        DB::table('attendance_transactions')->insert([
            ['attendance_id' => '00123', 'access_date_and_time' => '2026-09-14T08:11:04'],
            ['attendance_id' => '00123', 'access_date_and_time' => '2026-09-14T15:47:52'],
        ]);
        $day = $this->makeDay($sara, '2026-09-14', AttendanceStatus::PRESENT, [
            'check_in' => '2026-09-14 08:00:00',
            'check_out' => '2026-09-14 16:00:00',
            'worked_minutes' => 480,
            'is_manual' => true,
            'note' => 'Card reader was down',
        ]);
        $editor = $this->userWith('Attendance.Daily Attendance.Correct Attendance');

        $this->actingAs($editor)->put(route('attendance.days.reset', $day->id))->assertRedirect();

        $change = AttendanceDayChange::query()->sole();
        $this->assertSame(AttendanceChangeAction::RESET, $change->action);
        $this->assertSame($day->id, $change->attendance_day_id);
        $this->assertSame($editor->id, $change->changed_by);
        $this->assertSame('08:00:00', $change->before['check_in']);
        $this->assertSame('08:11:04', $change->after['check_in']);
        $this->assertSame(11, $change->after['late_minutes']);
    }

    public function test_the_log_outlives_a_day_that_no_longer_applies(): void
    {
        $sara = User::factory()->create();
        $day = $this->makeDay($sara, '2026-09-16', AttendanceStatus::ABSENT, ['is_manual' => true, 'note' => 'Was at the branch']);
        $editor = $this->userWith('Attendance.Daily Attendance.Correct Attendance');

        // Without a shift or punches, recalculating leaves nothing for that day.
        $this->actingAs($editor)->put(route('attendance.days.reset', $day->id))->assertRedirect();

        $this->assertModelMissing($day);
        $change = AttendanceDayChange::query()->sole();
        $this->assertNull($change->attendance_day_id);
        $this->assertNull($change->after);
        $this->assertSame($sara->id, $change->user_id);
        $this->assertSame('2026-09-16', $change->date->format('Y-m-d'));
    }

    public function test_a_calendar_day_shows_its_change_history(): void
    {
        $sara = User::factory()->create();
        $day = $this->makeDay($sara, '2026-09-15', AttendanceStatus::ABSENT);
        $editor = $this->userWith('Attendance.Daily Attendance.Correct Attendance', 'Attendance.Daily Attendance.List Attendance');
        $this->actingAs($editor)
            ->put(route('attendance.days.update', $day->id), ['check_in' => '08:20', 'check_out' => '16:00', 'note' => 'Forgot their card']);

        $this->actingAs($editor)
            ->get(route('attendance.calendar.index', ['user_id' => $sara->id, 'month' => '2026-09']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canCorrect', true)
                ->where('calendar.days.14.attendance.id', $day->id)
                ->where('calendar.days.14.attendance.is_manual', true)
                ->where('calendar.days.14.changes.0.action', 'CORRECTED')
                ->where('calendar.days.14.changes.0.by', $editor->name)
                ->where('calendar.days.14.changes.0.note', 'Forgot their card')
                ->where('calendar.days.14.changes.0.before.status_label', 'Absent')
                ->where('calendar.days.14.changes.0.after.check_in', '08:20')
                ->where('calendar.days.14.changes.0.after.status_label', 'Present')
                ->where('calendar.totals.corrected_days', 1));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function makeDay(User $user, string $date, AttendanceStatus $status, array $attributes = []): AttendanceDay
    {
        return AttendanceDay::create(array_merge([
            'user_id' => $user->id,
            'date' => $date,
            'scheduled_start' => '08:00:00',
            'scheduled_end' => '16:00:00',
            'status' => $status,
        ], $attributes));
    }

    private function userWith(string ...$permissions): User
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
