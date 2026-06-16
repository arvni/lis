<?php

namespace Tests\Feature\Referrer;

use App\Domains\Referrer\DTOs\ReferrerOrderDTO;
use App\Domains\Referrer\Events\ReferrerOrderCreated;
use App\Domains\Referrer\Events\ReferrerOrderUpdated;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Repositories\ReferrerOrderRepository;
use App\Domains\Referrer\Services\ReferrerOrderService;
use Exception;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class ReferrerOrderServiceTest extends TestCase
{
    private ReferrerOrderRepository $repo;
    private ReferrerOrderService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(ReferrerOrderRepository::class);
        $this->service = new ReferrerOrderService($this->repo);
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listReferrerOrder')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listReferrerOrders([]));
    }

    public function test_create_pooling_order_persists_and_dispatches_event(): void
    {
        Event::fake([ReferrerOrderCreated::class]);

        $dto = Mockery::mock(ReferrerOrderDTO::class);
        $dto->pooling = true;          // pooling orders skip the sendable-items check
        $dto->acceptanceId = null;
        $dto->shouldReceive('toArray')->andReturn(['order_id' => 'O1']);

        $order = new ReferrerOrder();
        $this->repo->shouldReceive('createReferrerOrder')->once()->with(['order_id' => 'O1'])->andReturn($order);

        $this->assertSame($order, $this->service->createReferrerOrder($dto));
        Event::assertDispatched(ReferrerOrderCreated::class);
    }

    public function test_update_delegates(): void
    {
        $dto = Mockery::mock(ReferrerOrderDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['order_id' => 'O2']);
        $order = new ReferrerOrder();
        $this->repo->shouldReceive('updateReferrerOrder')->once()->with($order, ['order_id' => 'O2'])->andReturn($order);

        $this->assertSame($order, $this->service->updateReferrerOrder($order, $dto));
    }

    public function test_update_status_no_op_when_unchanged(): void
    {
        $order = new ReferrerOrder(['status' => 'waiting']);
        $this->repo->shouldNotReceive('updateReferrerOrder');

        $this->assertSame($order, $this->service->updateReferrerOrderStatus($order, 'waiting'));
    }

    public function test_update_status_persists_and_dispatches_when_changed(): void
    {
        Event::fake([ReferrerOrderUpdated::class]);
        $order = new ReferrerOrder(['status' => 'waiting']);
        $updated = new ReferrerOrder(['status' => 'reported']);

        $this->repo->shouldReceive('updateReferrerOrder')->once()->with($order, ['status' => 'reported'])->andReturn($updated);

        $this->assertSame($updated, $this->service->updateReferrerOrderStatus($order, 'reported'));
        Event::assertDispatched(ReferrerOrderUpdated::class);
    }

    public function test_load_show_requirement_loads_relations(): void
    {
        $order = Mockery::mock(ReferrerOrder::class)->makePartial();
        $order->shouldReceive('load')->once()->with(Mockery::type('array'))->andReturnSelf();
        $this->assertSame($order, $this->service->loadShowRequirementLoaded($order));
    }

    public function test_delete_removes_order_without_acceptance(): void
    {
        $order = $this->orderWithAcceptance(false);
        $this->repo->shouldReceive('deleteReferrerOrder')->once()->with($order)->andReturnNull();
        $this->service->deleteReferrerOrder($order);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_order_has_acceptance(): void
    {
        $order = $this->orderWithAcceptance(true);
        $this->repo->shouldNotReceive('deleteReferrerOrder');
        $this->expectException(Exception::class);
        $this->service->deleteReferrerOrder($order);
    }

    private function orderWithAcceptance(bool $has): ReferrerOrder
    {
        $rel = Mockery::mock(BelongsTo::class);
        $rel->shouldReceive('exists')->andReturn($has);
        $order = Mockery::mock(ReferrerOrder::class)->makePartial();
        $order->shouldReceive('acceptance')->andReturn($rel);
        return $order;
    }
}
