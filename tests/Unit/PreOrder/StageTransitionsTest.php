<?php

declare(strict_types=1);

namespace Tests\Unit\PreOrder;

use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Support\BuiltInFlows;
use App\Domains\PreOrder\Support\FlowStages;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Every built-in flow against every pair of library stages, both ways: the workflow may only move
 * forward onto a stage the flow uses, plus the two named ways back to review.
 */
class StageTransitionsTest extends TestCase
{
    /** @return iterable<string, array{array<string, mixed>}> */
    public static function flows(): iterable
    {
        foreach (BuiltInFlows::all() as $flow) {
            yield $flow['family'] => [$flow];
        }
    }

    /** @param  array<string, mixed>  $flow */
    private function preOrder(array $flow): PreOrder
    {
        // Not saved, so a "when needed" stage counts as not needed: only "on" stages are used.
        return new PreOrder(['flow_stages' => $flow['stages']]);
    }

    /**
     * Stages the flow walks through, read straight from its definition.
     *
     * @param  array<string, mixed>  $flow
     * @return list<string>
     */
    private function onStages(array $flow): array
    {
        $on = array_column(array_filter($flow['stages'], fn (array $s) => $s['mode'] === 'on'), 'stage');

        // In library order.
        return array_values(array_map(
            fn (PreOrderStage $s) => $s->value,
            array_filter(PreOrderStage::cases(), fn (PreOrderStage $s) => $s->isAlwaysOn() || in_array($s->value, $on, true)),
        ));
    }

    /** @param  array<string, mixed>  $flow */
    #[DataProvider('flows')]
    public function test_every_move_between_two_stages_is_allowed_or_refused_as_the_flow_says(array $flow): void
    {
        $preOrder = $this->preOrder($flow);
        $on = $this->onStages($flow);
        $position = array_flip(array_map(fn (PreOrderStage $s) => $s->value, PreOrderStage::cases()));
        $backToReview = [PreOrderStage::AWAITING_FINANCE, PreOrderStage::FINANCE_VERIFY];

        $allowed = 0;
        foreach (PreOrderStage::cases() as $from) {
            foreach (PreOrderStage::cases() as $to) {
                foreach ([false, true] as $back) {
                    $wayBack = ($from === PreOrderStage::INFO_REVIEW && $to === PreOrderStage::AWAITING_INFO)
                        || ($back && $to === PreOrderStage::UNDER_REVIEW && in_array($from, $backToReview, true));
                    $expected = ($position[$to->value] > $position[$from->value] || $wayBack) && in_array($to->value, $on, true);

                    $refusal = FlowStages::moveRefusal($preOrder, $from, $to, $back);
                    $this->assertSame($expected, $refusal === null, sprintf(
                        '%s: %s → %s%s should be %s (%s)',
                        $flow['family'], $from->value, $to->value, $back ? ' (back)' : '', $expected ? 'allowed' : 'refused', $refusal ?? 'allowed',
                    ));
                    $allowed += $expected ? 1 : 0;
                }
            }
        }
        $this->assertGreaterThan(0, $allowed);
    }

    /** @param  array<string, mixed>  $flow */
    #[DataProvider('flows')]
    public function test_following_the_next_stage_from_a_draft_ends_at_results_through_only_allowed_moves(array $flow): void
    {
        $preOrder = $this->preOrder($flow);
        $walked = [PreOrderStage::DRAFT];
        $stage = PreOrderStage::DRAFT;
        while ($next = FlowStages::nextAfter($preOrder, $stage)) {
            $this->assertNull(FlowStages::moveRefusal($preOrder, $stage, $next), "{$stage->value} → {$next->value}");
            $walked[] = $stage = $next;
        }

        $this->assertSame(PreOrderStage::RESULTS_RELEASED, $stage);
        $this->assertSame($this->onStages($flow), array_map(fn (PreOrderStage $s) => $s->value, $walked), 'the walk visits exactly the stages the flow uses');
        foreach (PreOrderStage::cases() as $to) {
            $this->assertNotNull(FlowStages::moveRefusal($preOrder, PreOrderStage::RESULTS_RELEASED, $to, true), 'nothing comes after results');
        }
    }

    public function test_a_stage_the_flow_switched_off_is_refused_with_its_name(): void
    {
        $flow = collect(BuiltInFlows::all())->firstWhere('family', 'nipt');
        $this->assertNotNull($flow);

        $this->assertSame(
            "This flow doesn't use Samples received – more batches expected.",
            FlowStages::moveRefusal($this->preOrder($flow), PreOrderStage::AWAITING_SAMPLES, PreOrderStage::BATCH_OPEN),
        );
        $this->assertSame(
            "A pre-order can't go back from Testing in progress.",
            FlowStages::moveRefusal($this->preOrder($flow), PreOrderStage::TESTING, PreOrderStage::SUBMITTED),
        );
    }
}
