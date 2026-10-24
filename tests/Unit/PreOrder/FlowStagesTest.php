<?php

declare(strict_types=1);

namespace Tests\Unit\PreOrder;

use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Support\BuiltInFlows;
use App\Domains\PreOrder\Support\FlowStages;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class FlowStagesTest extends TestCase
{
    public function test_the_library_has_seventeen_stages_in_a_fixed_order(): void
    {
        $this->assertCount(17, PreOrderStage::cases());
        $this->assertSame(0, PreOrderStage::DRAFT->rank());
        $this->assertSame(16, PreOrderStage::RESULTS_RELEASED->rank());
        $this->assertSame(ActionOwner::CENTER, PreOrderStage::AWAITING_INFO->defaultOwner());
        $this->assertSame(ActionOwner::NONE, PreOrderStage::RESULTS_RELEASED->defaultOwner());
        $this->assertTrue(PreOrderStage::TESTING->isReadFromOrders());
        $this->assertFalse(PreOrderStage::UNDER_REVIEW->isReadFromOrders());
    }

    /** @return iterable<string, array{array<string, mixed>}> */
    public static function flows(): iterable
    {
        foreach (BuiltInFlows::all() as $flow) {
            yield $flow['family'] => [$flow];
        }
    }

    /** @param  array<string, mixed>  $flow */
    #[DataProvider('flows')]
    public function test_every_built_in_flow_lists_each_library_stage_once_in_order(array $flow): void
    {
        $this->assertSame(
            array_map(fn (PreOrderStage $s) => $s->value, PreOrderStage::cases()),
            array_column($flow['stages'], 'stage'),
        );
    }

    /** @param  array<string, mixed>  $flow */
    #[DataProvider('flows')]
    public function test_until_quoted_and_before_batches_every_flow_runs_the_core_path(array $flow): void
    {
        $preOrder = new PreOrder(['flow_stages' => $flow['stages']]);

        $this->assertSame(
            ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO', 'INFO_REVIEW', 'AWAITING_SAMPLES', 'TESTING', 'TESTING_COMPLETED', 'RESULTS_RELEASED'],
            array_map(fn (PreOrderStage $s) => $s->value, FlowStages::used($preOrder)),
        );
        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, FlowStages::nextAfter($preOrder, PreOrderStage::INFO_REVIEW));
        $this->assertNull(FlowStages::nextAfter($preOrder, PreOrderStage::RESULTS_RELEASED));
    }

    public function test_a_flow_can_rename_a_stage_for_the_center(): void
    {
        $pgt = array_values(array_filter(BuiltInFlows::all(), fn ($f) => $f['family'] === 'pgt_m'))[0];
        $preOrder = new PreOrder(['flow_stages' => $pgt['stages']]);

        $this->assertSame('Waiting for embryo samples', FlowStages::label($preOrder, PreOrderStage::AWAITING_SAMPLES));
        $this->assertSame('Under BION review', FlowStages::label($preOrder, PreOrderStage::UNDER_REVIEW));
    }

    public function test_a_pre_order_without_a_flow_still_has_the_shared_review_loop(): void
    {
        $preOrder = new PreOrder(['flow_stages' => null]);

        $this->assertTrue(FlowStages::uses($preOrder, PreOrderStage::AWAITING_INFO));
        $this->assertFalse(FlowStages::uses($preOrder, PreOrderStage::BATCH_OPEN));
    }
}
