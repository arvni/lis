<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\Laboratory\Models\Test;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Models\Flow;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\User\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PreOrderScreensTest extends PreOrderTestCase
{
    private const LIST = 'PreOrders.Cases.List';

    private const VIEW = 'PreOrders.Cases.View';

    private const REVIEW = 'PreOrders.Cases.Review';

    private const OVERRIDE = 'PreOrders.Cases.Override';

    private const FLOWS = 'PreOrders.Flows.Manage';

    /** @param  list<string>  $permissions */
    private function userWith(array $permissions): User
    {
        $user = User::factory()->create();
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function submitted(): PreOrder
    {
        return $this->workflow->submit($this->draft([$this->test('NIPT-'.uniqid(), 'nipt')]), $this->center());
    }

    public function test_the_queue_needs_the_list_permission_and_shows_cases_waiting_on_bion(): void
    {
        $waiting = $this->submitted();
        $this->draft([$this->test('NIPT-D', 'nipt')]);

        $this->actingAs($this->userWith([]))->get(route('pre-orders.index'))->assertForbidden();

        $this->actingAs($this->userWith([self::LIST]))
            ->get(route('pre-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('PreOrder/Index')
                ->has('preOrders.data', 1)
                ->where('preOrders.data.0.code', $waiting->code)
                ->has('stages', 17));
    }

    public function test_the_detail_page_shows_internal_notes_to_bion_only_through_the_bion_view(): void
    {
        $preOrder = $this->submitted();
        $this->workflow->message($preOrder, 'Discussed internally', $this->bion(), internal: true);

        $this->actingAs($this->userWith([self::LIST]))->get(route('pre-orders.show', $preOrder))->assertForbidden();

        $this->actingAs($this->userWith([self::VIEW]))
            ->get(route('pre-orders.show', $preOrder))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('PreOrder/Show')
                ->where('preOrder.code', $preOrder->code)
                ->where('preOrder.notes.0.body', 'Discussed internally')
                ->where('preOrder.can.open_review', true)
                ->has('preOrder.items.0.unit_price'));
    }

    public function test_stage_actions_need_the_review_permission(): void
    {
        $preOrder = $this->submitted();

        $this->actingAs($this->userWith([self::VIEW]))
            ->post(route('pre-orders.open-review', $preOrder))
            ->assertForbidden();

        $reviewer = $this->userWith([self::VIEW, self::REVIEW]);
        $this->actingAs($reviewer)
            ->from(route('pre-orders.show', $preOrder))
            ->post(route('pre-orders.open-review', $preOrder))
            ->assertRedirect(route('pre-orders.show', $preOrder))
            ->assertSessionHasNoErrors();

        $preOrder->refresh();
        $this->assertSame(PreOrderStage::UNDER_REVIEW, $preOrder->stage);
        $this->assertSame($reviewer->id, $preOrder->assigned_to);
    }

    public function test_a_refused_action_comes_back_as_a_readable_error(): void
    {
        $preOrder = $this->submitted();

        $this->actingAs($this->userWith([self::REVIEW]))
            ->from(route('pre-orders.show', $preOrder))
            ->post(route('pre-orders.confirm', $preOrder))
            ->assertRedirect(route('pre-orders.show', $preOrder))
            ->assertSessionHasErrors(['action' => 'Not possible while the pre-order is at New request submitted.']);
    }

    public function test_raising_a_request_validates_its_shape(): void
    {
        $preOrder = $this->workflow->openReview($this->submitted(), $this->bion());
        $reviewer = $this->userWith([self::REVIEW]);

        $this->actingAs($reviewer)
            ->post(route('pre-orders.requests.store', $preOrder), ['types' => ['teleport'], 'reason' => 'x', 'message' => 'y'])
            ->assertSessionHasErrors('types.0');

        $this->actingAs($reviewer)
            ->post(route('pre-orders.requests.store', $preOrder), ['types' => ['information'], 'reason' => 'pedigree', 'message' => 'Please upload the pedigree'])
            ->assertSessionHasNoErrors();
        $this->assertSame(PreOrderStage::AWAITING_INFO, $preOrder->refresh()->stage);
    }

    public function test_closing_after_samples_arrived_needs_the_override_permission(): void
    {
        $preOrder = $this->workflow->confirmTests($this->workflow->openReview($this->submitted(), $this->bion()), $this->bion());
        $this->linkedOrder($preOrder, 'processing', received: true);
        $body = ['type' => 'cancelled', 'reason' => 'cycle_cancelled', 'comment' => 'IVF cycle cancelled', 'override' => true];

        $this->actingAs($this->userWith([self::REVIEW]))->post(route('pre-orders.close', $preOrder), $body)->assertForbidden();

        $this->actingAs($this->userWith([self::REVIEW, self::OVERRIDE]))
            ->post(route('pre-orders.close', $preOrder), $body)
            ->assertSessionHasNoErrors();
        $this->assertNotNull($preOrder->refresh()->closed_at);
    }

    public function test_switching_a_test_on_for_pre_orders_needs_the_flows_permission_and_an_active_flow(): void
    {
        $testId = $this->test('WES');
        $flow = Flow::query()->where('family', 'exome')->firstOrFail();

        $this->actingAs($this->userWith([]))
            ->put(route('tests.pre-order', $testId), ['flow_id' => $flow->id, 'can_be_main' => true])
            ->assertForbidden();

        $manager = $this->userWith([self::FLOWS]);
        $this->actingAs($manager)
            ->put(route('tests.pre-order', $testId), ['flow_id' => $flow->id, 'can_be_main' => false])
            ->assertSessionHasNoErrors();
        $test = Test::query()->findOrFail($testId);
        $this->assertSame($flow->id, $test->flow_id);
        $this->assertFalse($test->preorder['can_be_main'] ?? true);

        $flow->update(['active' => false]);
        $this->actingAs($manager)
            ->put(route('tests.pre-order', $testId), ['flow_id' => $flow->id, 'can_be_main' => true])
            ->assertSessionHasErrors('flow_id');

        $this->actingAs($manager)
            ->put(route('tests.pre-order', $testId), ['flow_id' => null, 'can_be_main' => true])
            ->assertSessionHasNoErrors();
        $this->assertNull(Test::query()->findOrFail($testId)->flow_id, 'switched off: back to direct ordering');
    }
}
