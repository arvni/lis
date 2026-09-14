<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AttendanceTransactionControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Attendance.Transactions.List Transactions';

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('attendance.transactions.index'))
            ->assertForbidden();
    }

    public function test_punches_are_listed_newest_first_with_the_user_they_belong_to(): void
    {
        User::factory()->create(['name' => 'Sara Ahmed', 'attendance_number' => '00123']);
        $this->punch('00123', '2026-09-14T08:11:04');
        $this->punch('99999', '2026-09-14T09:00:00');
        $this->punch('00123', '2026-09-14T15:47:52');

        $this->actingAs($this->permittedUser())
            ->get(route('attendance.transactions.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/Transactions/Index', false)
                ->where('transactions.total', 3)
                ->where('transactions.data.0.access_date_and_time', '2026-09-14 15:47:52')
                ->where('transactions.data.0.attendance_id', '00123')
                ->where('transactions.data.0.user.name', 'Sara Ahmed')
                ->where('transactions.data.1.attendance_id', '99999')
                ->where('transactions.data.1.user', null)
                ->where('transactions.data.2.access_date_and_time', '2026-09-14 08:11:04'));
    }

    public function test_punches_can_be_narrowed_to_one_user(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        User::factory()->create(['attendance_number' => '00456']);
        $this->punch('00123', '2026-09-14T08:11:04');
        $this->punch('00456', '2026-09-14T08:20:00');

        $this->actingAs($this->permittedUser())
            ->get(route('attendance.transactions.index', ['filters' => ['user' => ['id' => $sara->id]]]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('transactions.total', 1)
                ->where('transactions.data.0.attendance_id', '00123'));
    }

    public function test_a_user_without_an_attendance_number_has_no_punches(): void
    {
        $newcomer = User::factory()->create(['attendance_number' => null]);
        $this->punch('00123', '2026-09-14T08:11:04');

        $this->actingAs($this->permittedUser())
            ->get(route('attendance.transactions.index', ['filters' => ['user' => ['id' => $newcomer->id]]]))
            ->assertInertia(fn (Assert $page) => $page->where('transactions.total', 0));
    }

    public function test_unmatched_employee_ids_can_be_listed_on_their_own(): void
    {
        User::factory()->create(['attendance_number' => '00123']);
        $this->punch('00123', '2026-09-14T08:11:04');
        $this->punch('99999', '2026-09-14T09:00:00');

        $this->actingAs($this->permittedUser())
            ->get(route('attendance.transactions.index', ['filters' => ['unmatched' => '1']]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('transactions.total', 1)
                ->where('transactions.data.0.attendance_id', '99999'));
    }

    public function test_punches_can_be_narrowed_by_employee_id_and_date(): void
    {
        $this->punch('00123', '2026-09-13T08:05:00');
        $this->punch('00123', '2026-09-14T08:11:04');
        $this->punch('00123', '2026-09-14T23:59:30');
        $this->punch('00456', '2026-09-14T08:20:00');

        $this->actingAs($this->permittedUser())
            ->get(route('attendance.transactions.index', ['filters' => [
                'attendance_id' => '00123',
                'from_date' => '2026-09-14',
                'to_date' => '2026-09-14',
            ]]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('transactions.total', 2)
                ->where('transactions.data.0.access_date_and_time', '2026-09-14 23:59:30')
                ->where('transactions.data.1.access_date_and_time', '2026-09-14 08:11:04'));
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

    private function permittedUser(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
