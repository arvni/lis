<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Exports\AttendanceMonthExport;
use App\Domains\Attendance\Exports\AttendanceSummaryExport;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Models\Holiday;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * "Now" is Thursday 17 Sep 2026; September 2026 starts on a Tuesday.
 */
class AttendanceMonthExportTest extends TestCase
{
    use RefreshDatabase;

    private const EXPORT = 'Attendance.Daily Attendance.Export Attendance';

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-09-17 18:00:00');
        Excel::fake();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_everyone_can_export_their_own_month_day_by_day_with_totals(): void
    {
        $sara = User::factory()->create(['name' => 'Sara Ahmed']);
        $this->morningShiftFor($sara);
        Holiday::create(['date' => '2026-09-15', 'title' => 'Test holiday']);
        $this->day($sara, '2026-09-14', AttendanceStatus::PRESENT, [
            'check_in' => '2026-09-14 08:11:04',
            'check_out' => '2026-09-14 15:47:52',
            'late_minutes' => 11,
            'early_leave_minutes' => 12,
            'worked_minutes' => 456,
        ]);
        // Saturday 12th: came in on a day off, so all of it is overtime.
        $this->day($sara, '2026-09-12', AttendanceStatus::OFF, [
            'check_in' => '2026-09-12 10:00:00',
            'check_out' => '2026-09-12 12:00:00',
            'worked_minutes' => 120,
            'overtime_minutes' => 120,
        ]);

        $this->actingAs($sara)
            ->get(route('attendance.calendar.export', ['month' => '2026-09']))
            ->assertOk();

        Excel::assertDownloaded('attendance-sara-ahmed-2026-09.xlsx', function (AttendanceMonthExport $export) {
            $rows = $export->array();

            return count($rows) === 31
                && $export->headings()[12] === 'Overtime (min)'
                && $rows[13] === ['2026-09-14', 'Monday', 'Morning', '08:00', '16:00', 480, 'Present', '08:11:04', '15:47:52', 11, 12, 456, 0, 0, null, null, 'No', null]
                && $rows[11][11] === 120 && $rows[11][12] === 120
                && $rows[2][6] === 'No record'
                && $rows[3][6] === 'Day off'
                && $rows[14][6] === 'Holiday' && $rows[14][5] === 0 && $rows[14][14] === 'Test holiday'
                && $rows[20][6] === 'Scheduled'
                && $rows[30][0] === 'Total'
                && $rows[30][5] === 21 * 480
                && $rows[30][11] === 576
                && $rows[30][12] === 120
                && $rows[30][6] === '1 present, 0 absent, 0 on leave';
        });
    }

    public function test_other_peoples_months_need_the_export_permission(): void
    {
        $sara = User::factory()->create();

        $this->actingAs($this->userWith('Attendance.Daily Attendance.List Attendance'))
            ->get(route('attendance.calendar.export', ['user_id' => $sara->id, 'month' => '2026-09']))
            ->assertForbidden();

        $this->actingAs($this->userWith(self::EXPORT))
            ->get(route('attendance.calendar.export', ['user_id' => $sara->id, 'month' => '2026-09']))
            ->assertOk();
    }

    public function test_the_staff_summary_needs_the_export_permission_and_sums_each_person(): void
    {
        $sara = User::factory()->create(['name' => 'Sara Ahmed', 'attendance_number' => '00123']);
        $omar = User::factory()->create(['name' => 'Omar Said', 'attendance_number' => null]);
        $this->morningShiftFor($sara);
        $this->day($sara, '2026-09-14', AttendanceStatus::PRESENT, ['late_minutes' => 11, 'early_leave_minutes' => 12, 'worked_minutes' => 456, 'overtime_minutes' => 30]);
        $this->day($sara, '2026-09-16', AttendanceStatus::ABSENT);
        $this->day($omar, '2026-09-10', AttendanceStatus::OFF, ['worked_minutes' => 120, 'overtime_minutes' => 120, 'is_manual' => true]);
        $this->day($omar, '2026-08-31', AttendanceStatus::PRESENT, ['worked_minutes' => 480, 'overtime_minutes' => 60]); // another month

        $this->actingAs($this->userWith('Attendance.Daily Attendance.List Attendance'))
            ->get(route('attendance.calendar.export-summary', ['month' => '2026-09']))
            ->assertForbidden();

        $this->actingAs($this->userWith(self::EXPORT))
            ->get(route('attendance.calendar.export-summary', ['month' => '2026-09']))
            ->assertOk();

        Excel::assertDownloaded('attendance-summary-2026-09.xlsx', fn (AttendanceSummaryExport $export) => $export->headings()[4] === 'Overtime (min)'
            && $export->array() === [
                ['Omar Said', null, 0, 120, 120, 0, 0, 0, 0, 0, 0, 1],
                ['Sara Ahmed', '00123', 22 * 480, 456, 30, 11, 12, 0, 1, 1, 0, 0],
            ]);
    }

    private function morningShiftFor(User $person): void
    {
        $shift = Shift::create(['name' => 'Morning']);
        foreach ([0, 1, 2, 3, 4] as $weekday) {
            $shift->days()->create(['weekday' => $weekday, 'start_time' => '08:00', 'end_time' => '16:00']);
        }
        UserShift::create(['user_id' => $person->id, 'shift_id' => $shift->id, 'effective_from' => '2026-09-01']);
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

    private function userWith(string $permission): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate($permission);
        $user->givePermissionTo($permission);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
