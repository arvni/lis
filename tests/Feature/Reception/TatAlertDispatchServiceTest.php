<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\DTOs\TatAlertDTO;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Models\TatAlertRule;
use App\Domains\Reception\Notifications\TatDeadlineApproaching;
use App\Domains\Reception\Services\TatAlertDispatchService;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class TatAlertDispatchServiceTest extends TestCase
{
    use RefreshDatabase;

    // A Wednesday. The lab weekend is Friday + Saturday.
    private const NOW = '2026-06-17 08:00:00';

    private const MONDAY = '2026-06-15 10:00:00';

    private Patient $patient;

    private User $recipient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->travelTo(Carbon::parse(self::NOW));
        Notification::fake();

        $this->recipient = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Ali Hassan',
            'idNo' => 'TATALERT001',
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    public function test_an_item_within_the_threshold_notifies_users_and_role_members_once(): void
    {
        $role = Role::create(['name' => 'Lab Supervisor', 'guard_name' => 'web']);
        $roleMember = User::factory()->create();
        $roleMember->assignRole($role);
        $directAndRoleMember = User::factory()->create();
        $directAndRoleMember->assignRole($role);
        $inactive = User::factory()->create(['is_active' => false]);
        $inactive->assignRole($role);

        // Monday + 3 working days → due Thursday, 1 working day left on Wednesday.
        $culture = $this->makeMethodTest(turnaround: 3);
        $this->addItem($this->makeAcceptance(), $culture);
        $this->makeRule([$culture], daysLeft: 1, users: [$this->recipient, $directAndRoleMember], roles: [$role]);

        $this->assertSame(1, $this->dispatchAlerts());

        $isThursdayDue = fn (TatDeadlineApproaching $n) => $n->alert->daysLeft === 1
            && $n->alert->deadline === '2026-06-18';
        Notification::assertSentTo($this->recipient, TatDeadlineApproaching::class, $isThursdayDue);
        Notification::assertSentTo($roleMember, TatDeadlineApproaching::class, $isThursdayDue);
        Notification::assertSentToTimes($directAndRoleMember, TatDeadlineApproaching::class, 1);
        Notification::assertNotSentTo($inactive, TatDeadlineApproaching::class);
    }

    public function test_items_above_the_threshold_or_of_other_tests_are_ignored(): void
    {
        $culture = $this->makeMethodTest(turnaround: 5);
        $otherTest = $this->makeMethodTest(turnaround: 1);
        $acceptance = $this->makeAcceptance();
        $this->addItem($acceptance, $culture); // 3 working days left
        $this->addItem($acceptance, $otherTest); // overdue, but not a test of this rule
        $this->makeRule([$culture], daysLeft: 1, users: [$this->recipient]);

        $this->assertSame(0, $this->dispatchAlerts());
        Notification::assertNothingSent();
    }

    public function test_reported_cancelled_and_parked_items_are_ignored(): void
    {
        $overdue = $this->makeMethodTest(turnaround: 1);
        $service = $this->makeMethodTest(turnaround: 1, type: TestType::SERVICE);

        $reported = $this->addItem($this->makeAcceptance(), $overdue);
        Report::create([
            'reporter_id' => auth()->id(),
            'acceptance_item_id' => $reported->id,
            'status' => true,
            'published_at' => now(),
            'approved_at' => now(),
        ]);
        $this->addItem($this->makeAcceptance(AcceptanceStatus::CANCELLED), $overdue);
        $this->addItem($this->makeAcceptance(AcceptanceStatus::REPORTED), $overdue);
        $this->addItem($this->makeAcceptance(pooling: true), $overdue);
        $this->addItem($this->makeAcceptance(), $overdue, reportless: true);
        $this->addItem($this->makeAcceptance(), $service);
        $this->makeRule([$overdue, $service], daysLeft: 5, users: [$this->recipient]);

        $this->assertSame(0, $this->dispatchAlerts());
        Notification::assertNothingSent();
    }

    public function test_an_overdue_item_is_still_reminded(): void
    {
        $test = $this->makeMethodTest(turnaround: 1); // due Tuesday
        $this->addItem($this->makeAcceptance(), $test);
        $this->makeRule([$test], daysLeft: 0, users: [$this->recipient]);

        $this->assertSame(1, $this->dispatchAlerts());
        Notification::assertSentTo(
            $this->recipient,
            TatDeadlineApproaching::class,
            fn (TatDeadlineApproaching $n) => $n->toArray($this->recipient)['title'] === 'TAT overdue by 1 working day',
        );
    }

    public function test_due_items_of_one_acceptance_share_one_notification(): void
    {
        $culture = $this->makeMethodTest(turnaround: 3); // due Thursday
        $panel = $this->makeMethodTest(turnaround: 2); // due today
        $acceptance = $this->makeAcceptance();
        $this->addItem($acceptance, $culture);
        $this->addItem($acceptance, $panel);
        $this->makeRule([$culture, $panel], daysLeft: 1, users: [$this->recipient]);

        $this->assertSame(1, $this->dispatchAlerts());

        Notification::assertSentToTimes($this->recipient, TatDeadlineApproaching::class, 1);
        Notification::assertSentTo(
            $this->recipient,
            TatDeadlineApproaching::class,
            function (TatDeadlineApproaching $n) use ($acceptance) {
                $data = $n->toArray($this->recipient);

                return $n->alert->acceptanceId === $acceptance->id
                    && count($n->alert->testNames) === 2
                    && $n->alert->daysLeft === 0
                    && $n->alert->deadline === '2026-06-17'
                    && $data['title'] === 'TAT due today'
                    && str_contains($data['message'], 'Ali Hassan')
                    && $data['url'] === route('acceptances.show', $acceptance->id);
            },
        );
    }

    public function test_a_paused_rule_or_a_rule_without_recipients_sends_nothing(): void
    {
        $test = $this->makeMethodTest(turnaround: 1);
        $this->addItem($this->makeAcceptance(), $test);
        $this->makeRule([$test], daysLeft: 1, users: [$this->recipient], active: false);
        $this->makeRule([$test], daysLeft: 1);

        $this->assertSame(0, $this->dispatchAlerts());
        Notification::assertNothingSent();
    }

    public function test_a_rule_reminds_once_a_day_unless_forced(): void
    {
        $test = $this->makeMethodTest(turnaround: 3);
        $this->addItem($this->makeAcceptance(), $test);
        $rule = $this->makeRule([$test], daysLeft: 1, users: [$this->recipient]);

        $this->assertSame(1, $this->dispatchAlerts());
        $this->assertSame('2026-06-17', $rule->refresh()->last_run_on?->toDateString());
        $this->assertSame(0, $this->dispatchAlerts());
        $this->assertSame(1, $this->dispatchAlerts(force: true));

        // Still unreported the next day, so it reminds again.
        $this->travelTo(Carbon::parse('2026-06-18 08:00:00'));
        $this->assertSame(1, $this->dispatchAlerts());

        Notification::assertSentToTimes($this->recipient, TatDeadlineApproaching::class, 3);
    }

    public function test_the_command_runs_the_rules(): void
    {
        $test = $this->makeMethodTest(turnaround: 1);
        $this->addItem($this->makeAcceptance(), $test);
        $this->makeRule([$test], daysLeft: 1, users: [$this->recipient]);

        $this->artisan('reception:send-tat-alerts')->assertSuccessful();

        Notification::assertSentToTimes($this->recipient, TatDeadlineApproaching::class, 1);
    }

    public function test_the_title_says_days_left_due_today_or_overdue(): void
    {
        $title = fn (int $daysLeft) => (new TatDeadlineApproaching(
            new TatAlertDTO(1, 'A-1', 'Ali Hassan', ['CBC'], $daysLeft, '2026-06-18', 'Due soon')
        ))->title();

        $this->assertSame('TAT alert: 2 working days left', $title(2));
        $this->assertSame('TAT alert: 1 working day left', $title(1));
        $this->assertSame('TAT due today', $title(0));
        $this->assertSame('TAT overdue by 3 working days', $title(-3));
    }

    private function dispatchAlerts(bool $force = false): int
    {
        return app(TatAlertDispatchService::class)->run(now(), $force);
    }

    private function makeMethodTest(int $turnaround, TestType $type = TestType::TEST): MethodTest
    {
        $test = Test::create([
            'name' => 'TAT Alert Test '.uniqid(),
            'fullName' => 'TAT Alert Test',
            'code' => 'TA'.uniqid(),
            'type' => $type,
            'status' => true,
            'can_merge' => false,
        ]);
        $method = Method::create([
            'name' => 'TAT Alert Method',
            'price' => 0,
            'turnaround_time' => $turnaround,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);

        return MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ]);
    }

    private function makeAcceptance(
        AcceptanceStatus $status = AcceptanceStatus::PROCESSING,
        bool $pooling = false,
    ): Acceptance {
        return Acceptance::create([
            'status' => $status,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => auth()->id(),
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => $pooling,
            'priority' => 'routine',
        ]);
    }

    private function addItem(
        Acceptance $acceptance,
        MethodTest $methodTest,
        string $createdAt = self::MONDAY,
        bool $reportless = false,
    ): AcceptanceItem {
        $item = AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 50,
            'discount' => 0,
            'reportless' => $reportless,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);
        $item->forceFill(['created_at' => Carbon::parse($createdAt)])->saveQuietly();

        return $item;
    }

    /**
     * @param  list<MethodTest>  $methodTests
     * @param  list<User>  $users
     * @param  list<Role>  $roles
     */
    private function makeRule(
        array $methodTests,
        int $daysLeft,
        array $users = [],
        array $roles = [],
        bool $active = true,
    ): TatAlertRule {
        $rule = TatAlertRule::create(['name' => 'Due soon', 'days_left' => $daysLeft, 'active' => $active]);
        $rule->tests()->attach(array_map(fn (MethodTest $methodTest) => $methodTest->test_id, $methodTests));
        $rule->users()->attach(array_map(fn (User $user) => $user->id, $users));
        $rule->roles()->attach(array_map(fn (Role $role) => $role->id, $roles));

        return $rule;
    }
}
