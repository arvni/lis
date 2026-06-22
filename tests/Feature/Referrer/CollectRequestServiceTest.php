<?php

namespace Tests\Feature\Referrer;

use App\Domains\Referrer\DTOs\CollectRequestDTO;
use App\Domains\Referrer\Enums\CollectRequestStatus;
use App\Domains\Referrer\Events\CollectRequestEvent;
use App\Domains\Referrer\Models\CollectRequest;
use App\Domains\Referrer\Repositories\CollectRequestRepository;
use App\Domains\Referrer\Repositories\ReferrerRepository;
use App\Domains\Referrer\Repositories\SampleCollectorRepository;
use App\Domains\Referrer\Services\CollectRequestService;
use Exception;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class CollectRequestServiceTest extends TestCase
{
    private CollectRequestRepository $repo;
    private CollectRequestService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(CollectRequestRepository::class);
        $this->service = new CollectRequestService(
            $this->repo,
            Mockery::mock(SampleCollectorRepository::class),
            Mockery::mock(ReferrerRepository::class),
        );
    }

    private function dto(array $data): CollectRequestDTO
    {
        $dto = Mockery::mock(CollectRequestDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listCollectRequest')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listCollectRequests([]));
    }

    public function test_list_for_calendar_delegates(): void
    {
        $collection = new Collection();
        $this->repo->shouldReceive('listCollectRequestsForCalendar')->once()->with('2026-06')->andReturn($collection);
        $this->assertSame($collection, $this->service->listForCalendar('2026-06'));
    }

    public function test_create_defaults_status_to_pending_and_dispatches_event(): void
    {
        Event::fake([CollectRequestEvent::class]);
        $cr = new CollectRequest();
        $cr->id = 1;

        $captured = null;
        $this->repo->shouldReceive('createCollectRequest')->once()->andReturnUsing(function ($data) use (&$captured, $cr) {
            $captured = $data;
            return $cr;
        });

        $this->service->createCollectRequest($this->dto(['referrer_id' => 1]));

        $this->assertSame(CollectRequestStatus::PENDING->value, $captured['status']);
        Event::assertDispatched(CollectRequestEvent::class);
    }

    public function test_update_with_new_collector_resets_status_and_assigns(): void
    {
        Event::fake([CollectRequestEvent::class]);
        $cr = new CollectRequest();
        $cr->id = 2;
        $cr->sample_collector_id = 1;

        $captured = null;
        $this->repo->shouldReceive('updateCollectRequest')->once()->andReturnUsing(function ($model, $data) use (&$captured, $cr) {
            $captured = $data;
            return $cr;
        });

        $this->service->updateCollectRequest($cr, $this->dto(['sample_collector_id' => 5]));

        $this->assertSame(CollectRequestStatus::PENDING->value, $captured['status']);
        Event::assertDispatched(CollectRequestEvent::class);
    }

    public function test_get_by_id_delegates(): void
    {
        $cr = new CollectRequest();
        $this->repo->shouldReceive('findCollectRequestById')->once()->with(9)->andReturn($cr);
        $this->assertSame($cr, $this->service->getCollectRequestById(9));
    }

    public function test_delete_removes_request_without_orders(): void
    {
        Event::fake([CollectRequestEvent::class]);
        $cr = $this->requestWithOrders(false);
        $this->repo->shouldReceive('deleteCollectRequest')->once()->with($cr)->andReturnNull();

        $this->service->deleteCollectRequest($cr);
        Event::assertDispatched(CollectRequestEvent::class);
    }

    public function test_delete_throws_when_request_has_orders(): void
    {
        $cr = $this->requestWithOrders(true);
        $this->repo->shouldNotReceive('deleteCollectRequest');
        $this->expectException(Exception::class);
        $this->service->deleteCollectRequest($cr);
    }

    private function requestWithOrders(bool $has): CollectRequest
    {
        $rel = Mockery::mock(HasMany::class);
        $rel->shouldReceive('exists')->andReturn($has);
        $cr = Mockery::mock(CollectRequest::class)->makePartial();
        $cr->id = 1;
        $cr->shouldReceive('referrerOrders')->andReturn($rel);
        return $cr;
    }
}
