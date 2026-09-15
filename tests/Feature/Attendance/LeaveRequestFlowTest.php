<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Enums\AttendanceStatus;
use App\Domains\Attendance\Enums\LeaveApprovalStatus;
use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Models\AttendanceDay;
use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Models\Shift;
use App\Domains\Attendance\Models\UserShift;
use App\Domains\Attendance\Notifications\LeaveRequestAwaitingApprovalNotification;
use App\Domains\Attendance\Notifications\LeaveRequestDecidedNotification;
use App\Domains\Inventory\Enums\WorkflowRequestType;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Leave requests end to end: steps from the matching leave workflow, approving in order, rejecting,
 * cancelling, and what approved leave does to attendance. "Now" is Thursday 17 Sep 2026, 18:00.
 */
class LeaveRequestFlowTest extends TestCase
{
    use RefreshDatabase;

    private const MANAGE = 'Attendance.Leave Requests.Manage Leave Requests';

    private LeaveKind $annual;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Carbon::setTestNow('2026-09-17 18:00:00');
        Notification::fake();
        $this->annual = LeaveKind::create(['name' => 'Annual']);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_a_request_follows_the_leave_workflow_matching_the_persons_role(): void
    {
        $staff = $this->person('Lab Staff');
        $supervisor = $this->person('Lab Supervisor');
        $hr = $this->person('HR Officer');
        // A purchasing template for the same role must not be used for leave.
        WorkflowTemplate::create([
            'name' => 'Staff purchases',
            'is_active' => true,
            'is_default' => false,
            'request_type' => null,
            'conditions' => ['requester_roles' => ['Lab Staff']],
            'priority' => 0,
        ]);
        $template = $this->leaveWorkflow(['Lab Staff'], [
            ['Supervisor review', 'Lab Supervisor', 2],
            ['HR sign-off', 'HR Officer', null],
        ]);

        $this->submit($staff, $this->daily('2026-09-20', '2026-09-24'))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $leave = $this->latestLeave();
        $this->assertSame(LeaveRequestStatus::PENDING, $leave->status);
        $this->assertSame($staff->id, $leave->user_id);
        $this->assertSame($staff->id, $leave->requested_by);
        $this->assertSame($template->id, $leave->workflow_template_id);
        $this->assertSame(['Supervisor review', 'HR sign-off'], $leave->approvals->pluck('name')->all());
        $this->assertSame('2026-09-19 18:00', $leave->approvals[0]->due_at?->format('Y-m-d H:i'));
        $this->assertNull($leave->approvals[1]->due_at);

        Notification::assertSentTo($supervisor, LeaveRequestAwaitingApprovalNotification::class);
        Notification::assertNotSentTo($hr, LeaveRequestAwaitingApprovalNotification::class);
    }

    public function test_approvers_act_in_order_and_the_last_approval_approves_the_leave(): void
    {
        $staff = $this->person('Lab Staff');
        $supervisor = $this->person('Lab Supervisor');
        $hr = $this->person('HR Officer');
        $this->leaveWorkflow(['Lab Staff'], [['Supervisor review', 'Lab Supervisor', null], ['HR sign-off', 'HR Officer', 3]]);
        $this->submit($staff, $this->daily('2026-09-20', '2026-09-24'));
        $leave = $this->latestLeave();

        $this->actingAs($hr)
            ->put(route('attendance.leave-requests.approve', $leave->id))
            ->assertSessionHas('success', false)
            ->assertSessionHas('status', 'This leave request is not waiting for your approval.');
        $this->assertSame(LeaveRequestStatus::PENDING, $leave->refresh()->status);

        $this->actingAs($supervisor)
            ->put(route('attendance.leave-requests.approve', $leave->id), ['notes' => 'Omar covers the bench'])
            ->assertSessionHas('success', true);

        $leave = $this->latestLeave();
        $this->assertSame(LeaveRequestStatus::PENDING, $leave->status);
        $this->assertSame(LeaveApprovalStatus::APPROVED, $leave->approvals[0]->status);
        $this->assertSame($supervisor->id, $leave->approvals[0]->acted_by);
        $this->assertSame('Omar covers the bench', $leave->approvals[0]->notes);
        // The next step's deadline starts when it becomes the current step.
        $this->assertSame('2026-09-20 18:00', $leave->approvals[1]->due_at?->format('Y-m-d H:i'));
        Notification::assertSentTo($hr, LeaveRequestAwaitingApprovalNotification::class);

        $this->actingAs($hr)
            ->put(route('attendance.leave-requests.approve', $leave->id))
            ->assertSessionHas('success', true);

        $leave = $this->latestLeave();
        $this->assertSame(LeaveRequestStatus::APPROVED, $leave->status);
        $this->assertNotNull($leave->decided_at);
        Notification::assertSentTo($staff, LeaveRequestDecidedNotification::class);
    }

    public function test_without_a_leave_workflow_leave_managers_approve(): void
    {
        $staff = $this->person();
        $manager = $this->manager();

        $this->submit($staff, $this->daily('2026-09-20', '2026-09-20'))->assertSessionHasNoErrors();

        $leave = $this->latestLeave();
        $this->assertNull($leave->workflow_template_id);
        $this->assertSame(['Leave manager approval'], $leave->approvals->pluck('name')->all());
        Notification::assertSentTo($manager, LeaveRequestAwaitingApprovalNotification::class);

        $this->actingAs($manager)
            ->put(route('attendance.leave-requests.approve', $leave->id))
            ->assertSessionHas('success', true);

        $this->assertSame(LeaveRequestStatus::APPROVED, $leave->refresh()->status);
    }

    public function test_nobody_approves_their_own_leave(): void
    {
        $manager = $this->manager();

        $this->submit($manager, $this->daily('2026-09-20', '2026-09-20'))->assertSessionHasNoErrors();
        $leave = $this->latestLeave();
        Notification::assertNotSentTo($manager, LeaveRequestAwaitingApprovalNotification::class);

        $this->actingAs($manager)
            ->put(route('attendance.leave-requests.approve', $leave->id))
            ->assertSessionHas('success', false)
            ->assertSessionHas('status', 'Nobody can approve their own leave.');

        $this->assertSame(LeaveRequestStatus::PENDING, $leave->refresh()->status);
    }

    public function test_a_rejection_needs_a_reason_and_is_final(): void
    {
        $staff = $this->person('Lab Staff');
        $supervisor = $this->person('Lab Supervisor');
        $hr = $this->person('HR Officer');
        $this->leaveWorkflow(['Lab Staff'], [['Supervisor review', 'Lab Supervisor', null], ['HR sign-off', 'HR Officer', null]]);
        $this->submit($staff, $this->daily('2026-09-20', '2026-09-24'));
        $leave = $this->latestLeave();

        $this->actingAs($supervisor)
            ->put(route('attendance.leave-requests.reject', $leave->id), ['notes' => ''])
            ->assertSessionHasErrors('notes');

        $this->actingAs($supervisor)
            ->put(route('attendance.leave-requests.reject', $leave->id), ['notes' => 'Inventory count that week'])
            ->assertSessionHas('success', true);

        $leave = $this->latestLeave();
        $this->assertSame(LeaveRequestStatus::REJECTED, $leave->status);
        $this->assertSame(
            [LeaveApprovalStatus::REJECTED, LeaveApprovalStatus::SKIPPED],
            $leave->approvals->pluck('status')->all()
        );
        Notification::assertSentTo($staff, LeaveRequestDecidedNotification::class);
        Notification::assertNotSentTo($hr, LeaveRequestAwaitingApprovalNotification::class);

        $this->actingAs($hr)
            ->put(route('attendance.leave-requests.approve', $leave->id))
            ->assertSessionHas('status', 'This leave request has already been rejected.');
    }

    public function test_overlapping_leave_is_refused_unless_it_was_cancelled(): void
    {
        $staff = $this->person();

        $this->submit($staff, $this->daily('2026-09-20', '2026-09-24'))->assertSessionHasNoErrors();
        $first = $this->latestLeave();

        $this->submit($staff, $this->hourly('2026-09-22', '10:00', '12:00'))
            ->assertSessionHasErrors(['start_date' => "{$staff->name} already has leave waiting for approval or approved at that time."]);
        $this->submit($staff, $this->daily('2026-09-25', '2026-09-26'))->assertSessionHasNoErrors();

        // Two hourly leaves on one day may sit side by side, but not overlap.
        $this->submit($staff, $this->hourly('2026-09-28', '10:00', '12:00'))->assertSessionHasNoErrors();
        $this->submit($staff, $this->hourly('2026-09-28', '11:00', '13:00'))->assertSessionHasErrors('start_date');
        $this->submit($staff, $this->hourly('2026-09-28', '12:00', '14:00'))->assertSessionHasNoErrors();

        $this->actingAs($staff)
            ->put(route('attendance.leave-requests.cancel', $first->id), ['reason' => 'Trip postponed'])
            ->assertSessionHas('success', true);
        $this->submit($staff, $this->hourly('2026-09-22', '10:00', '12:00'))->assertSessionHasNoErrors();

        $this->assertSame(5, LeaveRequest::query()->count());
    }

    public function test_the_dates_and_kind_are_checked(): void
    {
        $staff = $this->person();
        $retired = LeaveKind::create(['name' => 'Study', 'is_active' => false]);

        $this->submit($staff, $this->daily('2026-09-24', '2026-09-20'))->assertSessionHasErrors('end_date');
        $this->submit($staff, $this->hourly('2026-09-20', '10:00', '09:00'))->assertSessionHasErrors('end_time');
        $this->submit($staff, $this->daily('2026-09-20', '2026-09-20', ['leave_kind_id' => $retired->id]))
            ->assertSessionHasErrors('leave_kind_id');
        $this->submit($staff, $this->daily('2026-09-20', '2026-09-20', ['type' => 'WEEKLY']))->assertSessionHasErrors('type');

        $this->assertSame(0, LeaveRequest::query()->count());
    }

    public function test_only_leave_managers_enter_leave_for_someone_else(): void
    {
        $staff = $this->person();
        $colleague = $this->person();
        $manager = $this->manager();

        $this->submit($colleague, $this->daily('2026-09-20', '2026-09-20', ['user_id' => $staff->id]))->assertForbidden();

        $this->submit($manager, $this->daily('2026-09-20', '2026-09-20', ['user_id' => $staff->id]))
            ->assertSessionHasNoErrors();

        $leave = $this->latestLeave();
        $this->assertSame($staff->id, $leave->user_id);
        $this->assertSame($manager->id, $leave->requested_by);

        $this->actingAs($manager)
            ->getJson(route('api.attendance.leave-people.list', ['search' => $staff->name]))
            ->assertOk()
            ->assertJsonPath('data.0.id', $staff->id);
        $this->actingAs($colleague)
            ->getJson(route('api.attendance.leave-people.list'))
            ->assertForbidden();
    }

    public function test_approved_full_day_leave_shows_on_attendance(): void
    {
        $staff = $this->person(null, ['attendance_number' => '00123']);
        $this->morningShiftFor($staff);
        $manager = $this->manager();
        $this->artisan('attendance:process')->assertSuccessful();
        $this->assertSame(AttendanceStatus::ABSENT, $this->day($staff, '2026-09-15')?->status);

        $this->submit($staff, $this->daily('2026-09-15', '2026-09-19'));
        $this->actingAs($manager)->put(route('attendance.leave-requests.approve', $this->latestLeave()->id));

        foreach (['2026-09-15', '2026-09-16', '2026-09-17'] as $date) {
            $this->assertSame(AttendanceStatus::LEAVE, $this->day($staff, $date)?->status);
            $this->assertSame(480, $this->day($staff, $date)?->leave_minutes);
        }
        $this->assertSame(AttendanceStatus::ABSENT, $this->day($staff, '2026-09-14')?->status);
    }

    public function test_approved_hourly_leave_moves_when_the_person_is_expected(): void
    {
        $staff = $this->person(null, ['attendance_number' => '00123']);
        $this->morningShiftFor($staff);
        $manager = $this->manager();
        DB::table('attendance_transactions')->insert([
            ['attendance_id' => '00123', 'access_date_and_time' => '2026-09-16T10:05:00'],
            ['attendance_id' => '00123', 'access_date_and_time' => '2026-09-16T16:00:00'],
        ]);
        $this->artisan('attendance:process')->assertSuccessful();
        $this->assertSame(125, $this->day($staff, '2026-09-16')?->late_minutes);

        $this->submit($staff, $this->hourly('2026-09-16', '08:00', '10:00'));
        $this->actingAs($manager)->put(route('attendance.leave-requests.approve', $this->latestLeave()->id));

        $day = $this->day($staff, '2026-09-16');
        $this->assertSame(AttendanceStatus::PRESENT, $day?->status);
        $this->assertSame(5, $day->late_minutes);
        $this->assertSame(120, $day->leave_minutes);
    }

    public function test_approved_leave_that_started_is_cancelled_by_a_leave_manager(): void
    {
        $staff = $this->person(null, ['attendance_number' => '00123']);
        $this->morningShiftFor($staff);
        $manager = $this->manager();
        $this->submit($staff, $this->daily('2026-09-15', '2026-09-17'));
        $started = $this->latestLeave();
        $this->actingAs($manager)->put(route('attendance.leave-requests.approve', $started->id));
        $this->assertSame(AttendanceStatus::LEAVE, $this->day($staff, '2026-09-15')?->status);

        $this->actingAs($staff)
            ->put(route('attendance.leave-requests.cancel', $started->id))
            ->assertSessionHas('success', false)
            ->assertSessionHas('status', 'This leave has already started. Ask a leave manager to cancel it.');
        $this->assertSame(LeaveRequestStatus::APPROVED, $started->refresh()->status);

        $this->actingAs($manager)
            ->put(route('attendance.leave-requests.cancel', $started->id), ['reason' => 'Came in after all'])
            ->assertSessionHas('success', true);

        $started->refresh();
        $this->assertSame(LeaveRequestStatus::CANCELLED, $started->status);
        $this->assertSame($manager->id, $started->cancelled_by);
        $this->assertSame('Came in after all', $started->cancel_reason);
        $this->assertSame(AttendanceStatus::ABSENT, $this->day($staff, '2026-09-15')?->status);
        Notification::assertSentToTimes($staff, LeaveRequestDecidedNotification::class, 2);

        // Approved leave that hasn't started yet the person can still cancel themselves.
        $this->submit($staff, $this->daily('2026-09-27', '2026-09-28'));
        $upcoming = $this->latestLeave();
        $this->actingAs($manager)->put(route('attendance.leave-requests.approve', $upcoming->id));
        $this->actingAs($staff)
            ->put(route('attendance.leave-requests.cancel', $upcoming->id))
            ->assertSessionHas('success', true);
        $this->assertSame(LeaveRequestStatus::CANCELLED, $upcoming->refresh()->status);
    }

    public function test_people_see_their_requests_those_awaiting_them_and_managers_see_all(): void
    {
        $staff = $this->person('Lab Staff');
        $supervisor = $this->person('Lab Supervisor');
        $hr = $this->person('HR Officer');
        $manager = $this->manager();
        $this->leaveWorkflow(['Lab Staff'], [['Supervisor review', 'Lab Supervisor', null], ['HR sign-off', 'HR Officer', null]]);
        $this->submit($staff, $this->daily('2026-09-20', '2026-09-24'));

        $this->actingAs($staff)
            ->get(route('attendance.leave-requests.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Attendance/LeaveRequests/Index', false)
                ->where('requests.total', 1)
                ->where('requests.data.0.approvals.0.approver', 'Lab Supervisor')
                ->where('requests.data.0.can.cancel', true)
                ->where('requests.data.0.can.approve', false)
                ->where('canManage', false)
                ->has('kinds', 1));

        $this->actingAs($supervisor)
            ->get(route('attendance.leave-requests.index', ['filters' => ['scope' => 'approvals']]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('requests.total', 1)
                ->where('requests.data.0.can.approve', true));

        // Not their step yet.
        $this->actingAs($hr)
            ->get(route('attendance.leave-requests.index', ['filters' => ['scope' => 'approvals']]))
            ->assertInertia(fn (Assert $page) => $page->where('requests.total', 0));

        // "All" is for leave managers; anyone else sees their own requests.
        $this->actingAs($supervisor)
            ->get(route('attendance.leave-requests.index', ['filters' => ['scope' => 'all']]))
            ->assertInertia(fn (Assert $page) => $page->where('requests.total', 0));
        $this->actingAs($manager)
            ->get(route('attendance.leave-requests.index', ['filters' => ['scope' => 'all']]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('requests.total', 1)
                ->where('canManage', true));
    }

    public function test_people_outside_a_request_cannot_act_on_it(): void
    {
        $staff = $this->person();
        $this->submit($staff, $this->daily('2026-09-20', '2026-09-20'));
        $leave = $this->latestLeave();
        $outsider = $this->person();

        $this->actingAs($outsider)->put(route('attendance.leave-requests.approve', $leave->id))->assertForbidden();
        $this->actingAs($outsider)->put(route('attendance.leave-requests.cancel', $leave->id))->assertForbidden();

        $this->assertSame(LeaveRequestStatus::PENDING, $leave->refresh()->status);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function person(?string $role = null, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        if ($role !== null) {
            $user->assignRole(Role::findOrCreate($role, 'web'));
        }

        return $user;
    }

    private function manager(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::MANAGE);
        $user->givePermissionTo(self::MANAGE);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    /**
     * @param  list<string>  $requesterRoles
     * @param  list<array{0: string, 1: string, 2: int|null}>  $steps  [name, approver role, deadline days]
     */
    private function leaveWorkflow(array $requesterRoles, array $steps): WorkflowTemplate
    {
        $template = WorkflowTemplate::create([
            'name' => 'Leave '.uniqid(),
            'is_active' => true,
            'is_default' => false,
            'request_type' => WorkflowRequestType::LEAVE,
            'conditions' => ['requester_roles' => $requesterRoles],
            'priority' => 1,
        ]);
        foreach ($steps as $index => [$name, $role, $deadline]) {
            $template->steps()->create([
                'name' => $name,
                'sort_order' => $index,
                'approver_role' => $role,
                'deadline_days' => $deadline,
            ]);
        }

        return $template;
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
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function daily(string $from, string $to, array $overrides = []): array
    {
        return array_merge([
            'leave_kind_id' => $this->annual->id,
            'type' => 'DAILY',
            'start_date' => $from,
            'end_date' => $to,
            'reason' => 'Family visit',
        ], $overrides);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function hourly(string $date, string $from, string $to, array $overrides = []): array
    {
        return array_merge([
            'leave_kind_id' => $this->annual->id,
            'type' => 'HOURLY',
            'start_date' => $date,
            'start_time' => $from,
            'end_time' => $to,
        ], $overrides);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function submit(User $as, array $payload): TestResponse
    {
        return $this->actingAs($as)->post(route('attendance.leave-requests.store'), $payload);
    }

    private function latestLeave(): LeaveRequest
    {
        return LeaveRequest::query()->with('approvals')->latest('id')->firstOrFail();
    }

    private function day(User $user, string $date): ?AttendanceDay
    {
        return AttendanceDay::query()->where('user_id', $user->id)->whereDate('date', $date)->first();
    }
}
