<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Models\Flow;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Notifications\PreOrderReminderNotification;
use App\Domains\PreOrder\Support\FlowDefinition;
use App\Domains\PreOrder\Support\FlowStages;
use App\Domains\PreOrder\Support\PreOrderSnapshot;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;

class PreOrderFlowBuilderTest extends PreOrderTestCase
{
    /** @param  list<string>  $permissions */
    private function userWith(array $permissions): User
    {
        $user = User::factory()->create();
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }

        return $user;
    }

    /** The builder's form for a flow: its stages keyed by code, with any changes. */
    private function form(Flow $flow, array $changes = [], ?string $name = null): array
    {
        $stages = FlowDefinition::keyed($flow->stages);
        foreach ($changes as $code => $fields) {
            $stages[$code] = [...($stages[$code] ?? []), ...$fields];
        }

        return ['name' => $name ?? $flow->name, 'stages' => $stages];
    }

    /** A center-chosen case submitted to BION on a test of the given flow. */
    private function submitted(int $testId): PreOrder
    {
        return $this->workflow->submit($this->draft([$testId]), $this->center());
    }

    public function test_an_admin_copies_a_flow_publishes_version_2_and_only_new_pre_orders_follow_it(): void
    {
        $this->withoutVite();
        $admin = $this->userWith(['PreOrders.Flows.Manage']);
        $nipt = Flow::query()->where('family', 'nipt')->firstOrFail();

        $this->actingAs($admin)->get(route('pre-orders.flows.index'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('PreOrder/Flows/Index', false)->has('flows', 6));

        $this->actingAs($admin)->post(route('pre-orders.flows.copy', $nipt), ['name' => 'NIPT with BION check'])->assertRedirect();
        $copy = Flow::query()->where('name', 'NIPT with BION check')->firstOrFail();
        $this->assertSame(['nipt', 1], [$copy->family, $copy->version]);
        $test = $this->test('NIPTX', 'nipt');
        DB::table('tests')->where('id', $test)->update(['flow_id' => $copy->id]);

        // A case already running on version 1 of the copy.
        $open = $this->submitted($test);
        $this->assertSame(1, $open->flow_version);

        $this->actingAs($admin)->put(route('pre-orders.flows.update', $copy), $this->form($copy, [
            'FINANCE_VERIFY' => ['mode' => 'on', 'label_en' => 'BION finance check'],
            'SUBMITTED' => ['remind_after_hours' => 24, 'escalate_after_hours' => 72, 'action_ar' => 'بانتظار مراجعة بيون'],
            // Always-on stages stay on whatever the form says.
            'TESTING' => ['mode' => 'off'],
        ]))->assertSessionHasNoErrors();
        $copy->refresh();
        $this->assertSame(2, $copy->version);

        $new = $this->submitted($test);
        $this->assertSame(2, $new->flow_version);
        $this->assertTrue(FlowStages::uses($new, PreOrderStage::FINANCE_VERIFY));
        $this->assertTrue(FlowStages::uses($new, PreOrderStage::TESTING));
        $this->assertSame('BION finance check', FlowStages::label($new, PreOrderStage::FINANCE_VERIFY));
        $this->assertSame('بانتظار مراجعة بيون', app(PreOrderSnapshot::class)->build($new)['stage']['next_action_ar']);

        $open->refresh();
        $this->assertSame(1, $open->flow_version, 'an open pre-order keeps the version it started on');
        $this->assertFalse(FlowStages::uses($open, PreOrderStage::FINANCE_VERIFY));
    }

    public function test_the_builder_keeps_flows_consistent_and_needs_its_permission(): void
    {
        $admin = $this->userWith(['PreOrders.Flows.Manage']);
        $flow = Flow::query()->where('family', 'pgt_m')->firstOrFail();
        $update = fn (array $changes) => $this->actingAs($admin)->put(route('pre-orders.flows.update', $flow), $this->form($flow, $changes));

        $update(['FINANCE_VERIFY' => ['mode' => 'rule']])->assertSessionHasErrors('action');
        $update(['SUBMITTED' => ['remind_after_hours' => 48, 'escalate_after_hours' => 24]])->assertSessionHasErrors('action');
        $update(['AWAITING_SAMPLES' => ['batch_mode' => 'sideways']])->assertSessionHasErrors('stages.AWAITING_SAMPLES.batch_mode');
        $this->actingAs($admin)->put(route('pre-orders.flows.update', $flow), ['name' => 'X', 'stages' => ['NOT_A_STAGE' => []]])->assertSessionHasErrors('stages');
        $this->assertSame(1, $flow->refresh()->version, 'nothing refused was published');

        // The pre-test group switches as one, from its first stage.
        $update(['AWAITING_PRE_SAMPLES' => ['mode' => 'off'], 'PRE_COMPLETED' => ['mode' => 'on']])->assertSessionHasNoErrors();
        $modes = array_column($flow->refresh()->stages, 'mode', 'stage');
        $this->assertSame(['off', 'off', 'off', 'off'], [$modes['AWAITING_PRE_SAMPLES'], $modes['PRE_RECEIVED'], $modes['PRE_IN_PROGRESS'], $modes['PRE_COMPLETED']]);

        // A flow tests still use can't be switched off.
        $this->test('PGTM', 'pgt_m');
        $this->actingAs($admin)->post(route('pre-orders.flows.active', $flow), ['active' => false])->assertSessionHasErrors('action');
        $this->assertTrue($flow->refresh()->active);

        $reviewer = $this->userWith(['PreOrders.Cases.Review']);
        $this->actingAs($reviewer)->get(route('pre-orders.flows.index'))->assertForbidden();
        $this->actingAs($reviewer)->put(route('pre-orders.flows.update', $flow), $this->form($flow))->assertForbidden();
    }

    public function test_a_stuck_pre_order_is_reminded_once_then_escalated_and_a_new_stage_starts_over(): void
    {
        Notification::fake();
        $lead = $this->userWith(['PreOrders.Cases.Escalations']);
        $preOrder = $this->submitted($this->test('NIPT', 'nipt'));
        $stages = array_map(fn (array $s) => match ($s['stage']) {
            'SUBMITTED', 'UNDER_REVIEW' => [...$s, 'remind_after_hours' => 24, 'escalate_after_hours' => 72],
            default => $s,
        }, $preOrder->flow_stages);
        $preOrder->update(['flow_stages' => $stages, 'assigned_to' => $this->counsellor->id]);
        $this->assertSame(ActionOwner::BION, $preOrder->action_owner);

        $this->assertFalse($this->workflow->remindIfDue($preOrder->refresh()), 'not due yet');

        $this->travel(25)->hours();
        $this->artisan('pre-orders:send-reminders')->assertSuccessful();
        Notification::assertSentTo($this->counsellor, PreOrderReminderNotification::class, fn ($n) => ! $n->escalation);
        $this->assertNotNull($preOrder->refresh()->reminded_at);
        $this->assertFalse($this->workflow->remindIfDue($preOrder), 'once per stage');

        $this->travel(48)->hours();
        $this->assertTrue($this->workflow->remindIfDue($preOrder->refresh()));
        Notification::assertSentTo($lead, PreOrderReminderNotification::class, fn ($n) => $n->escalation);
        Notification::assertNotSentTo($this->counsellor, PreOrderReminderNotification::class, fn ($n) => $n->escalation);

        // A new stage starts the clock again.
        $preOrder = $this->workflow->openReview($preOrder->refresh(), $this->bion());
        $this->assertNull($preOrder->reminded_at);
        $this->assertNull($preOrder->escalated_at);

        // An exception pauses reminders.
        $this->workflow->hold($preOrder, 'bion_hold', 'Waiting on the lab director', $this->bion());
        $this->travel(30)->hours();
        $this->assertFalse($this->workflow->remindIfDue($preOrder->refresh()));
    }

    public function test_the_centers_reminder_is_a_history_row_it_sees(): void
    {
        Notification::fake();
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);
        $stages = array_map(fn (array $s) => $s['stage'] === 'DRAFT' ? [...$s, 'remind_after_hours' => 1] : $s, $preOrder->flow_stages);
        $preOrder->update(['flow_stages' => $stages, 'stage_entered_at' => now()->subHours(2)]);

        $this->assertTrue($this->workflow->remindIfDue($preOrder->refresh()));
        Notification::assertNothingSent();
        $snapshot = app(PreOrderSnapshot::class)->build($preOrder);
        $this->assertNotNull($snapshot['stage']['reminded_at']);
        $this->assertSame('Reminder: Complete and submit the pre-order', collect($snapshot['history'])->firstWhere('type', 'reminder')['body']);
    }

    public function test_reports_show_where_cases_sit_and_export_to_excel(): void
    {
        $this->withoutVite();
        Excel::fake();
        $test = $this->test('NIPT', 'nipt');
        $this->submitted($test);
        $cancelled = $this->draft([$test]);
        $this->workflow->close($cancelled, ExceptionType::CANCELLED, 'duplicate', null, $this->center());

        $viewer = $this->userWith(['PreOrders.Reports.View']);
        $this->actingAs($viewer)->get(route('pre-orders.reports'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('PreOrder/Reports', false)
                ->where('reports.by_stage.0.stage', 'New request submitted')
                ->where('reports.by_stage.0.family', 'nipt')
                ->where('reports.drop_offs.0.reason', 'duplicate'));

        $this->actingAs($viewer)->get(route('pre-orders.reports.export', ['from' => now()->subDay()->toDateString()]))->assertOk();
        Excel::assertDownloaded('pre-orders-'.now()->subDay()->toDateString().'-'.now()->toDateString().'.xlsx');

        $this->actingAs($this->userWith(['PreOrders.Cases.List']))->get(route('pre-orders.reports'))->assertForbidden();
    }
}
