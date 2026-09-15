<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Enums\LeaveType;
use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class LeaveKindControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_listing_and_managing_need_permissions(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('attendance.leave-kinds.index'))
            ->assertForbidden();

        $this->actingAs($this->userWith('Attendance.Leave Kinds.List Leave Kinds'))
            ->post(route('attendance.leave-kinds.store'), ['name' => 'Annual'])
            ->assertForbidden();
    }

    public function test_kinds_are_listed_by_name(): void
    {
        LeaveKind::create(['name' => 'Sick']);
        LeaveKind::create(['name' => 'Annual']);

        $this->actingAs($this->userWith('Attendance.Leave Kinds.List Leave Kinds'))
            ->get(route('attendance.leave-kinds.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/LeaveKinds/Index', false)
                ->where('kinds.total', 2)
                ->where('kinds.data.0.name', 'Annual'));
    }

    public function test_a_kind_is_created_with_a_unique_name(): void
    {
        $manager = $this->userWith('Attendance.Leave Kinds.Manage Leave Kinds');

        $this->actingAs($manager)
            ->post(route('attendance.leave-kinds.store'), ['name' => 'Annual', 'is_active' => true])
            ->assertSessionHasNoErrors();

        $this->actingAs($manager)
            ->post(route('attendance.leave-kinds.store'), ['name' => 'Annual'])
            ->assertSessionHasErrors('name');

        $this->assertSame(1, LeaveKind::query()->count());
    }

    public function test_a_kind_used_by_leave_requests_is_kept(): void
    {
        $used = LeaveKind::create(['name' => 'Annual']);
        $unused = LeaveKind::create(['name' => 'Unpaid']);
        $person = User::factory()->create();
        LeaveRequest::create([
            'user_id' => $person->id,
            'requested_by' => $person->id,
            'leave_kind_id' => $used->id,
            'type' => LeaveType::DAILY,
            'start_date' => '2026-09-20',
            'end_date' => '2026-09-20',
            'status' => LeaveRequestStatus::PENDING,
        ]);
        $manager = $this->userWith('Attendance.Leave Kinds.Manage Leave Kinds');

        $this->actingAs($manager)
            ->delete(route('attendance.leave-kinds.destroy', $used->id))
            ->assertSessionHas('success', false)
            ->assertSessionHas('status', "Annual is used by leave requests, so it can't be deleted. Mark it inactive instead.");
        $this->assertModelExists($used);

        $this->actingAs($manager)
            ->delete(route('attendance.leave-kinds.destroy', $unused->id))
            ->assertSessionHas('success', true);
        $this->assertModelMissing($unused);
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
