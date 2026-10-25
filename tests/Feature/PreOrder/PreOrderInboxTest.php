<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\Enums\ActionStatus;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Events\PreOrderActionProcessed;
use App\Domains\PreOrder\Events\PreOrderChanged;
use App\Domains\PreOrder\Listeners\SendPreOrderSnapshotWebhook;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderAction;
use App\Domains\PreOrder\Services\PreOrderInbox;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

class PreOrderInboxTest extends PreOrderTestCase
{
    private function action(string $type, array $payload, ?int $preOrderId = null, ?int $referrerId = null): PreOrderAction
    {
        return PreOrderAction::create([
            'uuid' => (string) Str::uuid(),
            'referrer_id' => $referrerId ?? $this->referrerId,
            'pre_order_id' => $preOrderId,
            'type' => $type,
            'payload' => $payload,
            'actor' => ['user_id' => 7, 'name' => 'Center nurse'],
            'status' => ActionStatus::PENDING,
        ]);
    }

    private function process(PreOrderAction $action): PreOrderAction
    {
        app(PreOrderInbox::class)->processOne($action->id);

        return $action->refresh();
    }

    public function test_create_and_submit_in_one_action(): void
    {
        $nipt = $this->test('NIPT', 'nipt');
        $action = $this->process($this->action('create', [
            'start_mode' => 'tests',
            'patients' => [['ref' => 'P1', 'fullName' => 'Mother Example']],
            'tests' => [['test_id' => $nipt]],
            'submit' => true,
        ]));

        $this->assertSame(ActionStatus::DONE, $action->status);
        $preOrder = PreOrder::query()->findOrFail($action->pre_order_id);
        $this->assertSame(PreOrderStage::SUBMITTED, $preOrder->stage);
        $this->assertSame($this->referrerId, $preOrder->referrer_id);
        $this->assertSame('Center nurse', $preOrder->histories()->first()?->actor_name);
        Event::assertDispatched(PreOrderActionProcessed::class, fn ($e) => $e->action->is($action));
    }

    public function test_a_resync_resends_the_snapshot_without_changing_the_pre_order(): void
    {
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);
        $version = $preOrder->version;
        Event::fake([PreOrderChanged::class, PreOrderActionProcessed::class]);

        $action = $this->process($this->action('resync', [], $preOrder->id));

        $this->assertSame(ActionStatus::DONE, $action->status);
        $this->assertSame($version, $preOrder->refresh()->version);
        Event::assertDispatchedTimes(PreOrderChanged::class, 1);

        // Still only for the center's own pre-orders.
        $theirs = $this->draft([$this->test('NIPT2', 'nipt')], $this->referrer('Other Hospital'));
        $this->assertSame(ActionStatus::FAILED, $this->process($this->action('resync', [], $theirs->id))->status);
    }

    public function test_pre_order_jobs_go_to_their_own_queue(): void
    {
        // The real dispatcher, so listeners are queued as in production.
        Event::swap(Event::getFacadeRoot()->dispatcher);
        Queue::fake();
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);

        PreOrderChanged::dispatch($preOrder);

        Queue::assertPushedOn('preorders', CallQueuedListener::class, fn (CallQueuedListener $job) => $job->class === SendPreOrderSnapshotWebhook::class);
    }

    public function test_a_center_cannot_act_on_another_centers_pre_order(): void
    {
        $theirs = $this->draft([$this->test('NIPT', 'nipt')], $this->referrer('Other Hospital'));

        $action = $this->process($this->action('submit', [], $theirs->id));

        $this->assertSame(ActionStatus::FAILED, $action->status);
        $this->assertSame('Pre-order not found.', $action->error);
        $this->assertSame(PreOrderStage::DRAFT, $theirs->refresh()->stage);
    }

    public function test_a_repeated_action_is_applied_once(): void
    {
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);
        $action = $this->action('message', ['body' => 'Hello BION'], $preOrder->id);

        $this->process($action);
        $this->process($action);
        app(PreOrderInbox::class)->processPending();

        $this->assertSame(1, $preOrder->histories()->where('type', 'comment')->count());
    }

    public function test_rule_and_validation_failures_come_back_as_readable_errors_and_change_nothing(): void
    {
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);

        $invalid = $this->process($this->action('answer_request', ['request' => 1], $preOrder->id));
        $this->assertSame(ActionStatus::FAILED, $invalid->status);
        $this->assertStringContainsString('answer', (string) $invalid->error);

        $rule = $this->process($this->action('answer_request', ['request' => 1, 'answer' => 'x'], $preOrder->id));
        $this->assertSame('Request R1 was not found.', $rule->error);

        $unknown = $this->process($this->action('teleport', [], $preOrder->id));
        $this->assertSame('Unknown action.', $unknown->error);

        $this->assertSame(1, $preOrder->refresh()->version, 'failed actions leave the pre-order untouched');
    }

    public function test_an_upload_naming_anything_but_a_generated_file_is_refused(): void
    {
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);
        $action = $this->process($this->action('upload_document', ['file' => '../../.env', 'name' => 'x.pdf', 'tag' => 'DOCUMENT'], $preOrder->id));

        $this->assertSame(ActionStatus::FAILED, $action->status);
        $this->assertSame(1, $preOrder->refresh()->version);
    }

    public function test_cancel_and_hold_from_the_center(): void
    {
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);

        $this->process($this->action('request_hold', ['reason' => 'patient_travelling'], $preOrder->id));
        $this->assertSame('hold_center', $preOrder->refresh()->exception['type'] ?? null);
        $this->process($this->action('resume', [], $preOrder->id));
        $this->assertNull($preOrder->refresh()->exception);

        $this->process($this->action('cancel', ['reason' => 'changed_mind'], $preOrder->id));
        $this->assertNotNull($preOrder->refresh()->closed_at);
    }
}
