<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Models\Holiday;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class HolidayControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = [
        'Attendance.Holidays.List Holidays',
        'Attendance.Holidays.Create Holiday',
        'Attendance.Holidays.Edit Holiday',
        'Attendance.Holidays.Delete Holiday',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('attendance.holidays.index'))
            ->assertForbidden();
    }

    public function test_creating_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('attendance.holidays.store'), ['date' => '2026-11-18', 'title' => 'National Day'])
            ->assertForbidden();

        $this->assertSame(0, Holiday::query()->count());
    }

    public function test_holidays_are_listed_newest_first_and_filtered_by_date(): void
    {
        Holiday::create(['date' => '2026-01-01', 'title' => 'New Year']);
        Holiday::create(['date' => '2026-07-23', 'title' => 'Renaissance Day']);
        Holiday::create(['date' => '2026-11-18', 'title' => 'National Day']);

        $user = $this->permittedUser();

        $this->actingAs($user)
            ->get(route('attendance.holidays.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/Holidays/Index', false)
                ->where('holidays.total', 3)
                ->where('holidays.data.0.date', '2026-11-18')
                ->where('holidays.data.0.weekday', 'Wednesday'));

        $this->actingAs($user)
            ->get(route('attendance.holidays.index', ['filters' => ['from_date' => '2026-02-01', 'to_date' => '2026-08-01']]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('holidays.total', 1)
                ->where('holidays.data.0.title', 'Renaissance Day'));
    }

    public function test_a_holiday_is_created(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('attendance.holidays.store'), ['date' => '2026-11-18', 'title' => 'National Day'])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $holiday = Holiday::query()->sole();

        $this->assertSame('2026-11-18', $holiday->date->format('Y-m-d'));
        $this->assertSame('National Day', $holiday->title);
    }

    public function test_a_date_can_only_be_a_holiday_once(): void
    {
        Holiday::create(['date' => '2026-11-18', 'title' => 'National Day']);

        $this->actingAs($this->permittedUser())
            ->post(route('attendance.holidays.store'), ['date' => '2026-11-18', 'title' => 'Duplicate'])
            ->assertSessionHasErrors('date');
    }

    public function test_the_date_must_be_a_real_date(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('attendance.holidays.store'), ['date' => '18/11/2026', 'title' => 'National Day'])
            ->assertSessionHasErrors('date');
    }

    public function test_a_holiday_is_updated_and_keeps_its_own_date(): void
    {
        $holiday = Holiday::create(['date' => '2026-11-18', 'title' => 'National Day']);

        $this->actingAs($this->permittedUser())
            ->put(route('attendance.holidays.update', $holiday->id), ['date' => '2026-11-18', 'title' => 'National Day (Oman)'])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertSame('National Day (Oman)', $holiday->refresh()->title);
    }

    public function test_a_holiday_is_deleted(): void
    {
        $holiday = Holiday::create(['date' => '2026-11-18', 'title' => 'National Day']);

        $this->actingAs($this->permittedUser())
            ->delete(route('attendance.holidays.destroy', $holiday->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('holidays', ['id' => $holiday->id]);
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
