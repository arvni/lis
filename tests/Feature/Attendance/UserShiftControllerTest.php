<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class UserShiftControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Attendance.Shift Assignments.Manage Shift Assignments';

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-09-14 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_managing_assignments_requires_permission(): void
    {
        $user = User::factory()->create();
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->getJson(route('api.attendance.users.shift-assignments.index', $user))
            ->assertForbidden();
        $this->actingAs($outsider)
            ->postJson(route('api.attendance.users.shift-assignments.store', $user), [
                'shift_id' => $this->makeShift('Morning')->id,
                'effective_from' => '2026-09-01',
            ])
            ->assertForbidden();
        $this->actingAs($outsider)
            ->getJson(route('api.attendance.shifts.list'))
            ->assertForbidden();

        $this->assertSame(0, UserShift::query()->count());
    }

    public function test_assignments_are_listed_newest_first_with_the_running_one_marked_current(): void
    {
        $user = User::factory()->create();
        $this->assign($user, $this->makeShift('Morning'), '2026-01-01', '2026-08-31');
        $this->assign($user, $this->makeShift('Evening'), '2026-09-01');

        $this->actingAs($this->permittedUser())
            ->getJson(route('api.attendance.users.shift-assignments.index', $user))
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.shift.name', 'Evening')
            ->assertJsonPath('data.0.effective_from', '2026-09-01')
            ->assertJsonPath('data.0.effective_to', null)
            ->assertJsonPath('data.0.is_current', true)
            ->assertJsonPath('data.1.shift.name', 'Morning')
            ->assertJsonPath('data.1.effective_to', '2026-08-31')
            ->assertJsonPath('data.1.is_current', false);
    }

    public function test_a_first_assignment_runs_until_further_notice(): void
    {
        $user = User::factory()->create();
        $morning = $this->makeShift('Morning');

        $this->actingAs($this->permittedUser())
            ->postJson(route('api.attendance.users.shift-assignments.store', $user), [
                'shift_id' => $morning->id,
                'effective_from' => '2026-09-01',
            ])
            ->assertCreated()
            ->assertJsonPath('data.shift.name', 'Morning')
            ->assertJsonPath('data.is_current', true);

        $assignment = UserShift::query()->sole();
        $this->assertSame($user->id, $assignment->user_id);
        $this->assertSame('2026-09-01', $assignment->effective_from->format('Y-m-d'));
        $this->assertNull($assignment->effective_to);
    }

    public function test_a_new_shift_ends_the_running_one_the_day_before(): void
    {
        $user = User::factory()->create();
        $running = $this->assign($user, $this->makeShift('Morning'), '2026-01-01');

        $this->actingAs($this->permittedUser())
            ->postJson(route('api.attendance.users.shift-assignments.store', $user), [
                'shift_id' => $this->makeShift('Evening')->id,
                'effective_from' => '2026-10-01',
            ])
            ->assertCreated();

        $this->assertSame('2026-09-30', $running->refresh()->effective_to?->format('Y-m-d'));
        $this->assertSame(2, UserShift::query()->where('user_id', $user->id)->count());
    }

    public function test_a_new_shift_must_start_after_the_latest_one_starts(): void
    {
        $user = User::factory()->create();
        $running = $this->assign($user, $this->makeShift('Morning'), '2026-09-01');

        $this->actingAs($this->permittedUser())
            ->postJson(route('api.attendance.users.shift-assignments.store', $user), [
                'shift_id' => $this->makeShift('Evening')->id,
                'effective_from' => '2026-09-01',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('effective_from');

        $this->assertNull($running->refresh()->effective_to);
        $this->assertSame(1, UserShift::query()->count());
    }

    public function test_an_inactive_shift_cannot_be_assigned(): void
    {
        $user = User::factory()->create();

        $this->actingAs($this->permittedUser())
            ->postJson(route('api.attendance.users.shift-assignments.store', $user), [
                'shift_id' => $this->makeShift('Retired', active: false)->id,
                'effective_from' => '2026-09-01',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('shift_id');
    }

    public function test_removing_the_latest_assignment_lets_the_one_it_replaced_run_on(): void
    {
        $user = User::factory()->create();
        $morning = $this->assign($user, $this->makeShift('Morning'), '2026-01-01', '2026-09-30');
        $evening = $this->assign($user, $this->makeShift('Evening'), '2026-10-01');

        $this->actingAs($this->permittedUser())
            ->deleteJson(route('api.attendance.users.shift-assignments.destroy', [$user, $evening]))
            ->assertOk();

        $this->assertModelMissing($evening);
        $this->assertNull($morning->refresh()->effective_to);
    }

    public function test_an_assignment_that_ended_on_its_own_stays_ended(): void
    {
        $user = User::factory()->create();
        $morning = $this->assign($user, $this->makeShift('Morning'), '2026-01-01', '2026-06-30');
        $evening = $this->assign($user, $this->makeShift('Evening'), '2026-09-01');

        $this->actingAs($this->permittedUser())
            ->deleteJson(route('api.attendance.users.shift-assignments.destroy', [$user, $evening]))
            ->assertOk();

        $this->assertSame('2026-06-30', $morning->refresh()->effective_to?->format('Y-m-d'));
    }

    public function test_only_the_latest_assignment_can_be_removed(): void
    {
        $user = User::factory()->create();
        $morning = $this->assign($user, $this->makeShift('Morning'), '2026-01-01', '2026-08-31');
        $this->assign($user, $this->makeShift('Evening'), '2026-09-01');

        $this->actingAs($this->permittedUser())
            ->deleteJson(route('api.attendance.users.shift-assignments.destroy', [$user, $morning]))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Only the latest shift assignment can be removed.');

        $this->assertModelExists($morning);
    }

    public function test_an_assignment_is_only_reachable_through_its_own_user(): void
    {
        $owner = User::factory()->create();
        $assignment = $this->assign($owner, $this->makeShift('Morning'), '2026-09-01');

        $this->actingAs($this->permittedUser())
            ->deleteJson(route('api.attendance.users.shift-assignments.destroy', [User::factory()->create(), $assignment]))
            ->assertNotFound();

        $this->assertModelExists($assignment);
    }

    public function test_only_active_shifts_are_offered_for_picking(): void
    {
        $this->makeShift('Morning');
        $this->makeShift('Evening');
        $this->makeShift('Morning (old)', active: false);

        $this->actingAs($this->permittedUser())
            ->getJson(route('api.attendance.shifts.list', ['search' => 'Morn']))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Morning');
    }

    private function makeShift(string $name, bool $active = true): Shift
    {
        $shift = Shift::create(['name' => $name, 'is_active' => $active]);
        $shift->days()->create(['weekday' => 0, 'start_time' => '08:00', 'end_time' => '16:00']);

        return $shift;
    }

    private function assign(User $user, Shift $shift, string $from, ?string $to = null): UserShift
    {
        return UserShift::create([
            'user_id' => $user->id,
            'shift_id' => $shift->id,
            'effective_from' => $from,
            'effective_to' => $to,
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
