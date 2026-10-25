<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\DTOs\CreatePreOrderDTO;
use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Enums\ActionStatus;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderAction;
use App\Domains\PreOrder\Services\PreOrderInbox;
use App\Domains\PreOrder\Support\PreOrderSnapshot;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;

class PreOrderBatchesTest extends PreOrderTestCase
{
    /** A center-chosen case (no quotation needed) in review, with a ride-along test for the father. */
    private function inReview(string $family): PreOrder
    {
        $main = $this->test('MAIN', $family);
        $parent = $this->test('KARYO', $family, canBeMain: false);
        $preOrder = $this->workflow->createDraft($this->referrerId, CreatePreOrderDTO::fromArray([
            'start_mode' => 'tests',
            'patients' => [
                ['ref' => 'P1', 'fullName' => 'Mother Example', 'gender' => 'female'],
                ['ref' => 'P2', 'fullName' => 'Father Example', 'gender' => 'male'],
            ],
            'tests' => [['test_id' => $main], ['test_id' => $parent, 'patient_ref' => 'P2']],
        ]), $this->center());

        return $this->workflow->openReview($this->workflow->submit($preOrder, $this->center()), $this->bion());
    }

    private function itemId(PreOrder $preOrder, string $code): int
    {
        return (int) $preOrder->items()->whereHas('test', fn ($q) => $q->where('code', $code))->value('id');
    }

    /** @return array<string, mixed> */
    private function snapshot(PreOrder $preOrder): array
    {
        return app(PreOrderSnapshot::class)->build($preOrder);
    }

    /** @param  array<string, mixed>  $payload */
    private function centerAction(PreOrder $preOrder, string $type, array $payload = []): PreOrderAction
    {
        $action = PreOrderAction::create([
            'uuid' => (string) Str::uuid(),
            'referrer_id' => $this->referrerId,
            'pre_order_id' => $preOrder->id,
            'type' => $type,
            'payload' => $payload,
            'actor' => ['user_id' => 7, 'name' => 'Center nurse'],
            'status' => ActionStatus::PENDING,
        ]);
        app(PreOrderInbox::class)->processOne($action->id);

        return $action->refresh();
    }

    private function setOrder(int $id, string $status, bool $received = true): void
    {
        DB::table('referrer_orders')->where('id', $id)->update(['status' => $status]);
        if ($received && DB::table('referrer_orders')->where('id', $id)->value('acceptance_id') === null) {
            $other = (int) DB::table('referrer_orders')->whereNotNull('acceptance_id')->value('acceptance_id');
            DB::table('referrer_orders')->where('id', $id)->update(['acceptance_id' => $other ?: null]);
        }
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

    public function test_pgt_m_runs_its_workup_then_embryo_cycles_with_a_replacement_until_bion_starts_testing(): void
    {
        $preOrder = $this->inReview('pgt_m');
        $code = $preOrder->code;

        // The workup comes first: BION marks the prerequisite test before confirming.
        $this->assertRule(fn () => $this->workflow->confirmTests($preOrder, $this->bion()), 'mark the prerequisite tests first');
        $this->assertRule(fn () => $this->workflow->setPreTest($preOrder, $this->itemId($preOrder, 'MAIN'), true, $this->bion()), "main test can't");
        $this->workflow->setPreTest($preOrder, $this->itemId($preOrder, 'KARYO'), true, $this->bion());
        $preOrder = $this->workflow->confirmTests($preOrder, $this->bion());

        $this->assertSame(PreOrderStage::AWAITING_PRE_SAMPLES, $preOrder->stage);
        $place = $this->snapshot($preOrder)['orders_to_place'];
        $this->assertSame([["$code-P1", 'pre']], array_map(fn ($o) => [$o['release_key'], $o['purpose']], $place));
        $this->assertCount(1, $place[0]['items'], 'only the pre-test goes now');

        // Stages 8–10 follow the pre-test order.
        $pre = $this->linkedOrder($preOrder, 'processing', received: true, release: 'P1');
        $this->assertSame(PreOrderStage::PRE_IN_PROGRESS, $this->workflow->syncFromOrders($preOrder)->stage);
        $this->setOrder($pre, 'reported');
        $preOrder = $this->workflow->syncFromOrders($preOrder);
        $this->assertSame(PreOrderStage::PRE_COMPLETED, $preOrder->stage);
        $this->assertSame(ActionOwner::CENTER, $preOrder->action_owner);

        // The center confirms the next step; the main test goes out.
        $this->assertSame(ActionStatus::DONE, $this->centerAction($preOrder, 'confirm_next_step', ['note' => 'IVF cycle planned'])->status);
        $preOrder->refresh();
        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage);
        $this->assertContains("$code-M2", array_column($this->snapshot($preOrder)['orders_to_place'], 'release_key'));

        // The first embryo batch arrives: more batches expected, not testing yet.
        $cycle1 = $this->linkedOrder($preOrder, 'processing', received: true, release: 'M2');
        $preOrder = $this->workflow->syncFromOrders($preOrder);
        $this->assertSame(PreOrderStage::BATCH_OPEN, $preOrder->stage);

        // Cycle 2 is its own order with the same tests.
        $this->centerAction($preOrder, 'add_batch', ['label' => 'Embryo cycle 2']);
        $snapshot = $this->snapshot($preOrder->refresh());
        $cycle2Order = collect($snapshot['orders_to_place'])->firstWhere('release_key', "$code-M3");
        $this->assertNotNull($cycle2Order);
        $this->assertSame(['MAIN'], array_map(fn ($i) => DB::table('tests')->where('id', $i['test_id'])->value('code'), $cycle2Order['items']));
        $this->assertSame(['Pre-test samples', 'Batch 1', 'Embryo cycle 2'], array_column($snapshot['batches'], 'label'));

        // Its samples are unusable: an exception on that batch only, for the center to answer.
        $preOrder = $this->workflow->raiseSampleIssue($preOrder, "$code-M3", 'Biopsy tubes leaked', $this->bion());
        $this->assertSame(ActionOwner::CENTER, $preOrder->action_owner);
        $snapshot = $this->snapshot($preOrder);
        $this->assertSame("$code-M3", $snapshot['center_can']['replace_batch']);
        $this->assertSame('Biopsy tubes leaked', collect($snapshot['batches'])->firstWhere('key', "$code-M3")['issue']);
        $this->assertSame('Only BION can lift this hold.', $this->centerAction($preOrder, 'resume')->error);

        // The replacement is free and goes on the same order: no new order to place.
        $this->centerAction($preOrder, 'add_batch', ['replaces' => "$code-M3"]);
        $preOrder->refresh();
        $this->assertNull($preOrder->exception);
        $snapshot = $this->snapshot($preOrder);
        $this->assertCount(3, $snapshot['orders_to_place']);
        $replacement = collect($snapshot['batches'])->firstWhere('replaces', "$code-M3");
        $this->assertSame("$code-M3", $replacement['order_key']);

        // No more batches; the lab moving on doesn't start testing, only BION does.
        $this->centerAction($preOrder, 'close_batches');
        $this->assertSame(PreOrderStage::READY_FOR_TESTING, $preOrder->refresh()->stage);
        $this->setOrder($cycle1, 'reported');
        $this->assertSame(PreOrderStage::READY_FOR_TESTING, $this->workflow->syncFromOrders($preOrder)->stage);

        $preOrder = $this->workflow->startTesting($preOrder, $this->bion());
        $this->assertSame(PreOrderStage::TESTING, $preOrder->stage, 'cycle 2 is not even placed yet');

        $cycle2 = $this->linkedOrder($preOrder, 'processing', received: true, release: 'M3');
        $this->assertSame(PreOrderStage::TESTING, $this->workflow->syncFromOrders($preOrder)->stage);
        $this->setOrder($cycle2, 'reported');
        $this->assertSame(PreOrderStage::RESULTS_RELEASED, $this->workflow->syncFromOrders($preOrder)->stage);
    }

    public function test_in_a_join_flow_later_batches_add_samples_to_the_first_order(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview('exome'), $this->bion());
        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage, 'no workup in this flow');
        $this->linkedOrder($preOrder, 'processing', received: true);
        $preOrder = $this->workflow->syncFromOrders($preOrder);
        $this->assertSame(PreOrderStage::BATCH_OPEN, $preOrder->stage);

        $preOrder = $this->workflow->addBatch($preOrder, 'Father blood', null, $this->center());
        $snapshot = $this->snapshot($preOrder);
        $this->assertCount(1, $snapshot['orders_to_place'], 'no second order');
        $this->assertSame("{$preOrder->code}-M1", collect($snapshot['batches'])->firstWhere('label', 'Father blood')['order_key']);
        $this->assertSame('join', $snapshot['batch_mode']);

        // A flow can keep closing the batches with BION.
        $stages = array_map(fn (array $s) => $s['stage'] === 'AWAITING_SAMPLES' ? [...$s, 'center_can_close' => false] : $s, $preOrder->flow_stages);
        $preOrder->update(['flow_stages' => $stages]);
        $this->assertFalse($this->snapshot($preOrder)['center_can']['close_batches']);
        $this->assertRule(fn () => $this->workflow->closeBatches($preOrder, $this->center()), 'BION closes the batches');
        $this->assertSame(PreOrderStage::READY_FOR_TESTING, $this->workflow->closeBatches($preOrder, $this->bion())->stage);
    }

    public function test_a_sample_issue_blocks_testing_and_starting_needs_its_permission(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview('pgt_a'), $this->bion());
        $this->linkedOrder($preOrder, 'processing', received: true);
        $preOrder = $this->workflow->closeBatches($this->workflow->syncFromOrders($preOrder), $this->bion());
        $this->workflow->raiseSampleIssue($preOrder, "{$preOrder->code}-M1", 'Haemolysed', $this->bion());
        $this->assertRule(fn () => $this->workflow->startTesting($preOrder, $this->bion()), 'sample issue');
        $this->assertSame(ExceptionType::SAMPLE_ISSUE->value, $preOrder->refresh()->exception['type']);
        $this->workflow->resume($preOrder, $this->bion());

        $reviewer = $this->userWith(['PreOrders.Cases.Review']);
        $this->actingAs($reviewer)->post(route('pre-orders.testing.start', $preOrder))->assertForbidden();
        $starter = $this->userWith(['PreOrders.Cases.Review', 'PreOrders.Cases.Start Testing']);
        $this->actingAs($starter)->post(route('pre-orders.testing.start', $preOrder))->assertSessionHasNoErrors();
        $this->assertSame(PreOrderStage::TESTING, $preOrder->refresh()->stage);
    }

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
}
