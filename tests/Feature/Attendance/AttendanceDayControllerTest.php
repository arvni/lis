<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Exports\AttendanceDaysExport;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AttendanceDayControllerTest extends TestCase
{
    use RefreshDatabase;

    private const LIST = 'Attendance.Daily Attendance.List Attendance';

    private const CORRECT = 'Attendance.Daily Attendance.Correct Attendance';

    private const EXPORT = 'Attendance.Daily Attendance.Export Attendance';

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

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('attendance.days.index'))
            ->assertForbidden();
    }

    public function test_days_are_listed_newest_first_and_can_be_filtered(): void
    {
        $sara = User::factory()->create(['name' => 'Sara Ahmed']);
        $omar = User::factory()->create(['name' => 'Omar Said']);
        $this->makeDay($sara, '2026-09-14', AttendanceStatus::PRESENT);
        $this->makeDay($sara, '2026-09-15', AttendanceStatus::ABSENT);
        $this->makeDay($omar, '2026-09-15', AttendanceStatus::PRESENT, ['is_manual' => true, 'note' => 'Forgot card']);
        $viewer = $this->userWith(self::LIST);

        $this->actingAs($viewer)
            ->get(route('attendance.days.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/Days/Index', false)
                ->where('days.total', 3)
                ->where('days.data.0.date', '2026-09-15')
                ->where('days.data.0.scheduled_start', '08:00')
                ->has('statuses', 6));

        $this->actingAs($viewer)
            ->get(route('attendance.days.index', ['filters' => ['status' => 'ABSENT']]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('days.total', 1)
                ->where('days.data.0.user.name', 'Sara Ahmed')
                ->where('days.data.0.status_label', 'Absent'));

        $this->actingAs($viewer)
            ->get(route('attendance.days.index', ['filters' => ['user' => ['id' => $omar->id]]]))
            ->assertInertia(fn (Assert $page) => $page->where('days.total', 1));

        $this->actingAs($viewer)
            ->get(route('attendance.days.index', ['filters' => ['from_date' => '2026-09-15', 'to_date' => '2026-09-15']]))
            ->assertInertia(fn (Assert $page) => $page->where('days.total', 2));

        $this->actingAs($viewer)
            ->get(route('attendance.days.index', ['filters' => ['corrected' => '1']]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('days.total', 1)
                ->where('days.data.0.note', 'Forgot card'));
    }

    public function test_correcting_a_day_recalculates_it_and_records_who_did_it(): void
    {
        $day = $this->makeDay(User::factory()->create(), '2026-09-15', AttendanceStatus::ABSENT);
        $editor = $this->userWith(self::CORRECT);

        $this->actingAs($editor)
            ->put(route('attendance.days.update', $day->id), [
                'check_in' => '08:20',
                'check_out' => '16:00',
                'note' => 'Forgot their card',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $day->refresh();
        $this->assertSame(AttendanceStatus::PRESENT, $day->status);
        $this->assertSame('2026-09-15 08:20:00', $day->check_in?->format('Y-m-d H:i:s'));
        $this->assertSame('2026-09-15 16:00:00', $day->check_out?->format('Y-m-d H:i:s'));
        $this->assertSame(20, $day->late_minutes);
        $this->assertSame(0, $day->early_leave_minutes);
        $this->assertSame(460, $day->worked_minutes);
        $this->assertTrue($day->is_manual);
        $this->assertSame('Forgot their card', $day->note);
        $this->assertSame($editor->id, $day->corrected_by);
        $this->assertNotNull($day->corrected_at);
    }

    public function test_clearing_both_times_makes_a_working_day_absent(): void
    {
        $day = $this->makeDay(User::factory()->create(), '2026-09-15', AttendanceStatus::PRESENT, [
            'check_in' => '2026-09-15 08:00:00',
            'check_out' => '2026-09-15 16:00:00',
            'worked_minutes' => 480,
        ]);

        $this->actingAs($this->userWith(self::CORRECT))
            ->put(route('attendance.days.update', $day->id), ['check_in' => '', 'check_out' => '', 'note' => 'Was on sick leave'])
            ->assertSessionHasNoErrors();

        $day->refresh();
        $this->assertSame(AttendanceStatus::ABSENT, $day->status);
        $this->assertNull($day->check_in);
        $this->assertSame(0, $day->worked_minutes);
    }

    public function test_a_correction_needs_a_reason_and_times_in_order(): void
    {
        $day = $this->makeDay(User::factory()->create(), '2026-09-15', AttendanceStatus::ABSENT);
        $editor = $this->userWith(self::CORRECT);

        $this->actingAs($editor)
            ->put(route('attendance.days.update', $day->id), ['check_in' => '16:00', 'check_out' => '08:00', 'note' => ''])
            ->assertSessionHasErrors(['check_out', 'note']);

        $this->actingAs($editor)
            ->put(route('attendance.days.update', $day->id), ['check_in' => '', 'check_out' => '16:00', 'note' => 'Left at four'])
            ->assertSessionHasErrors('check_in');

        $this->assertFalse($day->refresh()->is_manual);
    }

    public function test_correcting_requires_permission(): void
    {
        $day = $this->makeDay(User::factory()->create(), '2026-09-15', AttendanceStatus::ABSENT);

        $this->actingAs($this->userWith(self::LIST))
            ->put(route('attendance.days.update', $day->id), ['check_in' => '08:00', 'check_out' => '16:00', 'note' => 'Forgot card'])
            ->assertForbidden();

        $this->actingAs($this->userWith(self::LIST))
            ->put(route('attendance.days.reset', $day->id))
            ->assertForbidden();
    }

    public function test_recalculating_a_corrected_day_goes_back_to_the_punches(): void
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
            'shift_id' => $shift->id,
            'check_in' => '2026-09-14 08:00:00',
            'check_out' => '2026-09-14 16:00:00',
            'is_manual' => true,
            'note' => 'Card reader was down',
        ]);

        $this->actingAs($this->userWith(self::CORRECT))
            ->put(route('attendance.days.reset', $day->id))
            ->assertRedirect();

        $day->refresh();
        $this->assertFalse($day->is_manual);
        $this->assertNull($day->note);
        $this->assertNull($day->corrected_by);
        $this->assertSame(11, $day->late_minutes);
        $this->assertSame('2026-09-14 08:11:04', $day->check_in?->format('Y-m-d H:i:s'));
    }

    public function test_export_downloads_the_filtered_days(): void
    {
        Excel::fake();
        $sara = User::factory()->create(['name' => 'Sara Ahmed']);
        $this->makeDay($sara, '2026-09-14', AttendanceStatus::PRESENT);
        $this->makeDay($sara, '2026-09-15', AttendanceStatus::ABSENT);

        $this->actingAs($this->userWith(self::EXPORT))
            ->get(route('attendance.days.export', ['filters' => ['status' => 'ABSENT']]))
            ->assertOk();

        Excel::assertDownloaded('attendance-2026-09-17.xlsx', function (AttendanceDaysExport $export) {
            $rows = $export->collection();

            return $rows->count() === 1
                && $export->map($rows->first()) === [
                    '2026-09-15', 'Tuesday', 'Sara Ahmed', null, '08:00', '16:00', null, null,
                    'Absent', 0, 0, 0, 0, 'No', null,
                ];
        });
    }

    public function test_export_requires_permission(): void
    {
        $this->actingAs($this->userWith(self::LIST))
            ->get(route('attendance.days.export'))
            ->assertForbidden();
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

    private function userWith(string $permission): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate($permission);
        $user->givePermissionTo($permission);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
