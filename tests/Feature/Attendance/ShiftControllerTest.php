<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Enums\Weekday;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ShiftControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = [
        'Attendance.Shifts.List Shifts',
        'Attendance.Shifts.Create Shift',
        'Attendance.Shifts.Edit Shift',
        'Attendance.Shifts.Delete Shift',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('attendance.shifts.index'))
            ->assertForbidden();
    }

    public function test_creating_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('attendance.shifts.store'), $this->payload())
            ->assertForbidden();

        $this->assertSame(0, Shift::query()->count());
    }

    public function test_a_permitted_user_sees_shifts_with_their_weekly_hours(): void
    {
        $shift = $this->makeShift('Morning', [Weekday::SUNDAY->value => ['08:00', '16:00']]);

        $this->actingAs($this->permittedUser())
            ->get(route('attendance.shifts.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/Shifts/Index', false)
                ->where('shifts.total', 1)
                ->where('shifts.data.0.id', $shift->id)
                ->where('shifts.data.0.days.0.weekday', Weekday::SUNDAY->value)
                ->where('shifts.data.0.days.0.start_time', '08:00')
                ->where('shifts.data.0.days.0.end_time', '16:00')
                ->has('weekdays', 7)
                ->where('weekdays.0.label', 'Sunday'));
    }

    public function test_a_shift_is_created_with_only_its_working_days(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('attendance.shifts.store'), $this->payload([
                'days' => [
                    ['weekday' => Weekday::SUNDAY->value, 'start_time' => '08:00', 'end_time' => '16:00'],
                    ['weekday' => Weekday::THURSDAY->value, 'start_time' => '08:00', 'end_time' => '12:00'],
                ],
            ]))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $shift = Shift::query()->with('days')->firstWhere('name', 'Morning');

        $this->assertNotNull($shift);
        $this->assertTrue($shift->is_active);
        $this->assertSame(
            [[Weekday::SUNDAY, '08:00:00', '16:00:00'], [Weekday::THURSDAY, '08:00:00', '12:00:00']],
            $shift->days->map(fn ($day) => [$day->weekday, $day->start_time, $day->end_time])->all()
        );
    }

    public function test_a_shift_needs_at_least_one_working_day(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('attendance.shifts.store'), $this->payload(['days' => []]))
            ->assertSessionHasErrors('days');
    }

    public function test_hours_must_end_after_they_start(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('attendance.shifts.store'), $this->payload([
                'days' => [
                    ['weekday' => 1, 'start_time' => '08:00', 'end_time' => '16:00'],
                    ['weekday' => 2, 'start_time' => '22:00', 'end_time' => '06:00'],
                ],
            ]))
            ->assertSessionHasErrors('days.1.end_time')
            ->assertSessionDoesntHaveErrors('days.0.end_time');
    }

    public function test_a_weekday_cannot_be_listed_twice(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('attendance.shifts.store'), $this->payload([
                'days' => [
                    ['weekday' => 1, 'start_time' => '08:00', 'end_time' => '12:00'],
                    ['weekday' => 1, 'start_time' => '13:00', 'end_time' => '17:00'],
                ],
            ]))
            ->assertSessionHasErrors('days.1.weekday');
    }

    public function test_a_weekday_must_exist(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('attendance.shifts.store'), $this->payload([
                'days' => [['weekday' => 7, 'start_time' => '08:00', 'end_time' => '16:00']],
            ]))
            ->assertSessionHasErrors('days.0.weekday');
    }

    public function test_shift_names_are_unique_but_a_shift_keeps_its_own(): void
    {
        $shift = $this->makeShift('Morning', [1 => ['08:00', '16:00']]);
        $user = $this->permittedUser();

        $this->actingAs($user)
            ->post(route('attendance.shifts.store'), $this->payload(['name' => 'Morning']))
            ->assertSessionHasErrors('name');

        $this->actingAs($user)
            ->put(route('attendance.shifts.update', $shift->id), $this->payload(['name' => 'Morning']))
            ->assertSessionHasNoErrors();
    }

    public function test_updating_a_shift_replaces_its_weekly_hours(): void
    {
        $shift = $this->makeShift('Morning', [
            Weekday::SUNDAY->value => ['08:00', '16:00'],
            Weekday::MONDAY->value => ['08:00', '16:00'],
        ]);

        $this->actingAs($this->permittedUser())
            ->put(route('attendance.shifts.update', $shift->id), $this->payload([
                'name' => 'Short week',
                'is_active' => false,
                'days' => [['weekday' => Weekday::TUESDAY->value, 'start_time' => '09:30', 'end_time' => '13:00']],
            ]))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $shift->refresh()->load('days');

        $this->assertSame('Short week', $shift->name);
        $this->assertFalse($shift->is_active);
        $this->assertSame(
            [[Weekday::TUESDAY, '09:30:00', '13:00:00']],
            $shift->days->map(fn ($day) => [$day->weekday, $day->start_time, $day->end_time])->all()
        );
    }

    public function test_deleting_a_shift_removes_its_weekly_hours(): void
    {
        $shift = $this->makeShift('Morning', [1 => ['08:00', '16:00']]);

        $this->actingAs($this->permittedUser())
            ->delete(route('attendance.shifts.destroy', $shift->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('shifts', ['id' => $shift->id]);
        $this->assertDatabaseMissing('shift_days', ['shift_id' => $shift->id]);
    }

    public function test_a_shift_that_was_ever_assigned_cannot_be_deleted(): void
    {
        $shift = $this->makeShift('Morning', [1 => ['08:00', '16:00']]);
        UserShift::create([
            'user_id' => User::factory()->create()->id,
            'shift_id' => $shift->id,
            'effective_from' => '2026-01-01',
            'effective_to' => '2026-06-30',
        ]);

        $this->actingAs($this->permittedUser())
            ->delete(route('attendance.shifts.destroy', $shift->id))
            ->assertRedirect()
            ->assertSessionHas('success', false)
            ->assertSessionHas('status', "Morning is assigned to users, so it can't be deleted. Mark it inactive instead.");

        $this->assertModelExists($shift);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Morning',
            'description' => null,
            'is_active' => true,
            'days' => [['weekday' => Weekday::SUNDAY->value, 'start_time' => '08:00', 'end_time' => '16:00']],
        ], $overrides);
    }

    /**
     * @param  array<int, array{0: string, 1: string}>  $hours  weekday => [start, end]
     */
    private function makeShift(string $name, array $hours): Shift
    {
        $shift = Shift::create(['name' => $name]);
        foreach ($hours as $weekday => [$start, $end]) {
            $shift->days()->create(['weekday' => $weekday, 'start_time' => $start, 'end_time' => $end]);
        }

        return $shift;
    }

    private function permittedUser(): User
    {
        $user = User::factory()->create();

        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
