<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\DTOs\RaiseRequestDTO;
use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Enums\ItemStatus;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Events\PreOrderChanged;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Support\PreOrderSnapshot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class PreOrderWorkflowTest extends PreOrderTestCase
{
    private function infoRequest(bool $blocking = false): RaiseRequestDTO
    {
        return RaiseRequestDTO::fromArray([
            'types' => ['information'],
            'reason' => 'pedigree',
            'message' => 'Please upload the pedigree.',
            'blocking' => $blocking,
        ]);
    }

    public function test_nipt_runs_from_draft_through_an_information_request_to_a_released_order(): void
    {
        $nipt = $this->test('NIPT', 'nipt');
        $preOrder = $this->draft([$nipt]);

        $this->assertSame(PreOrderStage::DRAFT, $preOrder->stage);
        $this->assertMatchesRegularExpression('/^PO-\d{2}-\d{4}$/', $preOrder->code);
        $this->assertSame($nipt, $preOrder->main_test_id, 'the chosen test proposes the flow');
        $this->assertNotNull($preOrder->flow_stages);

        $preOrder = $this->workflow->submit($preOrder, $this->center());
        $this->assertSame(PreOrderStage::SUBMITTED, $preOrder->stage);
        $this->assertSame(ActionOwner::BION, $preOrder->action_owner);

        $preOrder = $this->workflow->openReview($preOrder, $this->bion());
        $this->assertSame($this->counsellor->id, $preOrder->assigned_to, 'whoever opens the review takes the case');

        $request = $this->workflow->raiseRequest($preOrder, $this->infoRequest(), $this->bion());
        $preOrder->refresh();
        $this->assertSame(1, $request->number);
        $this->assertSame(PreOrderStage::AWAITING_INFO, $preOrder->stage);
        $this->assertSame(ActionOwner::CENTER, $preOrder->action_owner);

        $preOrder = $this->workflow->answerRequest($preOrder, 1, 'Uploaded the pedigree', $this->center());
        $this->assertSame(PreOrderStage::INFO_REVIEW, $preOrder->stage);
        $this->assertSame(ActionOwner::BION, $preOrder->action_owner);

        $preOrder = $this->workflow->confirmTests($preOrder, $this->bion());
        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage, 'finance and batches are off in phase 1');
        $this->assertSame(ActionOwner::CENTER, $preOrder->action_owner);
        $item = $preOrder->items()->firstOrFail();
        $this->assertSame(ItemStatus::RELEASED, $item->status);
        $this->assertSame($preOrder->code.'-M1', $item->release_key);
        $this->assertSame('closed', $preOrder->requests()->first()?->status->value, 'confirming settles answered requests');

        $snapshot = app(PreOrderSnapshot::class)->build($preOrder);
        $this->assertSame([[
            'release_key' => $preOrder->code.'-M1',
            'purpose' => 'main',
            'items' => [['test_id' => $nipt, 'patient_ref' => 'P1', 'qty' => 1]],
        ]], $snapshot['orders_to_place']);
        $this->assertSame(
            ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO', 'INFO_REVIEW', 'AWAITING_SAMPLES', 'TESTING', 'TESTING_COMPLETED', 'RESULTS_RELEASED'],
            array_column($snapshot['progress'], 'code'),
        );

        // Every change was announced and versioned.
        Event::assertDispatched(PreOrderChanged::class);
        $this->assertGreaterThan(5, $preOrder->version);
        $this->assertSame(
            ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO', 'INFO_REVIEW', 'AWAITING_SAMPLES'],
            $preOrder->histories()->where('type', 'stage')->orderBy('id')->pluck('to_stage')->all(),
        );
    }

    public function test_a_case_sent_without_tests_gets_its_test_flow_and_counsellor_from_bion(): void
    {
        $exome = $this->test('WES', 'exome');
        $karyotype = $this->test('KARYO', null, canBeMain: false);
        $preOrder = $this->draft();
        $this->assertNull($preOrder->flow_id);

        $preOrder = $this->workflow->submit($preOrder, $this->center());
        $preOrder = $this->workflow->openReview($preOrder, $this->bion());
        $this->assertSame('BION is choosing the right test', app(PreOrderSnapshot::class)->build($preOrder)['stage']['next_action']);

        try {
            $this->workflow->confirmTests($preOrder, $this->bion());
            $this->fail('confirmed without a main test');
        } catch (PreOrderRuleException $e) {
            $this->assertStringContainsString('main test', $e->getMessage());
        }

        $this->assertRule(fn () => $this->workflow->setMainTest($preOrder, $karyotype, null, $this->bion()), 'cannot be the main test');

        $preOrder = $this->workflow->setMainTest($preOrder, $exome, 'Trio exome fits the history', $this->bion());
        $this->workflow->addTest($preOrder, $karyotype, 'P2', 1, $this->bion());
        $preOrder = $this->workflow->confirmTests($preOrder->refresh(), $this->bion());

        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage);
        $this->assertSame(DB::table('flows')->where('family', 'exome')->value('id'), $preOrder->flow_id);
        $this->assertSame(2, $preOrder->items()->where('status', 'released')->count(), 'a ride-along test goes on the same order');
        $this->assertSame(['bion', 'bion'], $preOrder->items()->pluck('added_by')->map->value->all());
    }

    public function test_stages_never_move_back_and_released_tests_are_frozen(): void
    {
        $nipt = $this->test('NIPT', 'nipt');
        $preOrder = $this->workflow->submit($this->draft([$nipt]), $this->center());

        $this->assertRule(fn () => $this->workflow->submit($preOrder, $this->center()), 'Not possible');
        $this->assertRule(fn () => $this->workflow->raiseRequest($preOrder, $this->infoRequest(), $this->bion()), 'Open the review');

        $preOrder = $this->workflow->openReview($preOrder, $this->bion());
        $this->assertRule(fn () => $this->workflow->raiseRequest($preOrder, RaiseRequestDTO::fromArray([
            'types' => ['test'], 'reason' => 'sanger', 'message' => 'Confirm by Sanger',
        ]), $this->bion()), 'not available yet');

        $preOrder = $this->workflow->confirmTests($preOrder, $this->bion());
        $this->assertRule(fn () => $this->workflow->addTest($preOrder, $nipt, null, 1, $this->bion()), 'already released');
        $this->assertRule(fn () => $this->workflow->setMainTest($preOrder, $nipt, null, $this->bion()), 'already released');
        $this->assertRule(fn () => $this->workflow->openReview($preOrder, $this->bion()), 'Not possible');
    }

    public function test_an_unanswered_request_blocks_release_and_answering_twice_is_refused(): void
    {
        $preOrder = $this->reviewing();
        $this->workflow->raiseRequest($preOrder, $this->infoRequest(), $this->bion());
        $preOrder->refresh();

        $this->assertRule(fn () => $this->workflow->confirmTests($preOrder, $this->bion()), 'Not possible');

        $preOrder = $this->workflow->answerRequest($preOrder, 1, 'Here it is', $this->center());
        $this->assertRule(fn () => $this->workflow->answerRequest($preOrder, 1, 'again', $this->center()), 'no longer waiting');
        $this->assertRule(fn () => $this->workflow->answerRequest($preOrder, 9, 'x', $this->center()), 'R9 was not found');

        // Asking again goes back to waiting for the center: the one allowed step back in the review loop.
        $this->workflow->raiseRequest($preOrder, $this->infoRequest(), $this->bion());
        $this->assertSame(PreOrderStage::AWAITING_INFO, $preOrder->refresh()->stage);
        $preOrder = $this->workflow->closeRequest($preOrder, 2, false, 'Not needed after all', $this->bion());
        $this->assertSame(PreOrderStage::INFO_REVIEW, $preOrder->stage);
    }

    public function test_a_blocking_request_after_release_makes_the_center_owner_without_moving_the_stage(): void
    {
        $preOrder = $this->workflow->confirmTests($this->reviewing(), $this->bion());
        $this->workflow->raiseRequest($preOrder, RaiseRequestDTO::fromArray([
            'types' => ['samples'], 'reason' => 'insufficient_dna', 'message' => 'Please send a new tube', 'blocking' => true,
        ]), $this->bion());
        $preOrder->refresh();

        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage);
        $this->assertSame(ActionOwner::CENTER, $preOrder->action_owner);

        $preOrder = $this->workflow->answerRequest($preOrder, 1, 'Sent on Tuesday', $this->center());
        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage);
    }

    public function test_lab_progress_is_read_from_the_linked_orders(): void
    {
        $preOrder = $this->workflow->confirmTests($this->reviewing(), $this->bion());

        $first = $this->linkedOrder($preOrder);
        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $this->workflow->syncFromOrders($preOrder)->stage, 'placed but not received');

        DB::table('referrer_orders')->where('id', $first)->delete();
        $first = $this->linkedOrder($preOrder, 'processing', received: true);
        $second = $this->linkedOrder($preOrder, 'waiting');
        $this->assertSame(PreOrderStage::TESTING, $this->workflow->syncFromOrders($preOrder)->stage);

        DB::table('referrer_orders')->where('id', $first)->update(['status' => 'reported']);
        $this->assertSame(PreOrderStage::TESTING, $this->workflow->syncFromOrders($preOrder)->stage, 'one order still running');

        DB::table('referrer_orders')->where('id', $second)->update(['status' => 'waiting for financial approval']);
        $this->assertSame(PreOrderStage::TESTING_COMPLETED, $this->workflow->syncFromOrders($preOrder)->stage);

        DB::table('referrer_orders')->where('id', $second)->update(['status' => 'downloaded']);
        $preOrder = $this->workflow->syncFromOrders($preOrder);
        $this->assertSame(PreOrderStage::RESULTS_RELEASED, $preOrder->stage);
        $this->assertSame(ActionOwner::NONE, $preOrder->action_owner);
        $this->assertNotNull($preOrder->closed_at);

        // A later status flap never moves a released pre-order back.
        DB::table('referrer_orders')->where('id', $second)->update(['status' => 'processing']);
        $this->assertSame(PreOrderStage::RESULTS_RELEASED, $this->workflow->syncFromOrders($preOrder)->stage);
    }

    public function test_holds_set_the_owner_and_only_the_holder_side_lifts_a_bion_hold(): void
    {
        $preOrder = $this->reviewing();

        $preOrder = $this->workflow->hold($preOrder, 'patient_travelling', 'Back next month', $this->center());
        $this->assertSame(ExceptionType::HOLD_CENTER->value, $preOrder->exception['type'] ?? null);
        $this->assertSame(ActionOwner::CENTER, $preOrder->action_owner);
        $this->assertSame(PreOrderStage::UNDER_REVIEW, $preOrder->stage, 'an exception never replaces the stage');
        $preOrder = $this->workflow->resume($preOrder, $this->center());
        $this->assertSame(ActionOwner::BION, $preOrder->action_owner);

        $preOrder = $this->workflow->hold($preOrder, 'awaiting_lab_capacity', null, $this->bion());
        $this->assertRule(fn () => $this->workflow->resume($preOrder, $this->center()), 'Only BION');
        $this->assertNull($this->workflow->resume($preOrder, $this->bion())->exception);
    }

    public function test_a_center_cancels_only_before_release_and_received_samples_need_an_override(): void
    {
        $open = $this->reviewing();
        $closed = $this->workflow->close($open, ExceptionType::CANCELLED, 'changed_mind', null, $this->center());
        $this->assertNotNull($closed->closed_at);
        $this->assertSame(ActionOwner::NONE, $closed->action_owner);
        $this->assertRule(fn () => $this->workflow->hold($closed, 'x', null, $this->center()), 'closed');
        // Messages stay open after the end, e.g. a question about a released report.
        $this->workflow->message($closed, 'Thanks', $this->center());

        $released = $this->workflow->confirmTests($this->reviewing(), $this->bion());
        $this->assertRule(fn () => $this->workflow->close($released, ExceptionType::CANCELLED, 'x', null, $this->center()), 'Ask BION');

        $this->linkedOrder($released, 'processing', received: true);
        $this->assertRule(fn () => $this->workflow->close($released, ExceptionType::CANCELLED, 'x', null, $this->bion()), 'override');
        $this->assertNotNull($this->workflow->close($released, ExceptionType::CANCELLED, 'x', 'Cycle cancelled', $this->bion(), override: true)->closed_at);
    }

    public function test_internal_notes_never_reach_the_center_snapshot(): void
    {
        $preOrder = $this->reviewing();
        $this->workflow->message($preOrder, 'Visible to the center', $this->bion());
        $this->workflow->message($preOrder, 'Price exception discussed with finance', $this->bion(), internal: true);
        $this->assertRule(fn () => $this->workflow->message($preOrder, 'sneaky', $this->center(), internal: true), 'Only BION');

        $bodies = array_column(app(PreOrderSnapshot::class)->build($preOrder)['history'], 'body');
        $this->assertContains('Visible to the center', $bodies);
        $this->assertNotContains('Price exception discussed with finance', $bodies);
        $this->assertArrayNotHasKey('unit_price', app(PreOrderSnapshot::class)->build($preOrder)['items'][0]);
    }

    public function test_tests_not_switched_on_for_pre_orders_are_refused_from_the_center(): void
    {
        $direct = $this->test('CBC');
        $this->assertRule(fn () => $this->draft([$direct]), 'not available for pre-orders');
        $this->assertSame(0, PreOrder::query()->count(), 'nothing half-written');
    }

    private function reviewing(): PreOrder
    {
        $nipt = $this->test('NIPT-'.uniqid(), 'nipt');
        $preOrder = $this->workflow->submit($this->draft([$nipt]), $this->center());

        return $this->workflow->openReview($preOrder, $this->bion());
    }

    private function assertRule(\Closure $action, string $message): void
    {
        try {
            $action();
        } catch (PreOrderRuleException $e) {
            $this->assertStringContainsString($message, $e->getMessage());

            return;
        }
        $this->fail("Expected a rule error containing \"$message\".");
    }
}
