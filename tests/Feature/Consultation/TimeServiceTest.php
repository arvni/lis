<?php

namespace Tests\Feature\Consultation;

use App\Domains\Consultation\DTOs\TimeDTO;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Models\Time;
use App\Domains\Consultation\Repositories\TimeRepository;
use App\Domains\Consultation\Services\TimeService;
use Illuminate\Database\Eloquent\Collection;
use Mockery;
use Tests\TestCase;

class TimeServiceTest extends TestCase
{
    private TimeRepository $repo;
    private TimeService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(TimeRepository::class);
        $this->service = new TimeService($this->repo);
    }

    private function dto(array $data = ['day' => 'mon']): TimeDTO
    {
        $dto = Mockery::mock(TimeDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    public function test_list_delegates(): void
    {
        $collection = new Collection();
        $this->repo->shouldReceive('ListTimes')->once()->andReturn($collection);
        $this->assertSame($collection, $this->service->listTimes([]));
    }

    public function test_store_delegates(): void
    {
        $time = new Time();
        $this->repo->shouldReceive('createTime')->once()->with(['day' => 'mon'])->andReturn($time);
        $this->assertSame($time, $this->service->storeTime($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $time = new Time();
        $this->repo->shouldReceive('updateTime')->once()->with($time, ['day' => 'mon'])->andReturn($time);
        $this->assertSame($time, $this->service->updateTime($time, $this->dto()));
    }

    public function test_delete_delegates(): void
    {
        $time = new Time();
        $this->repo->shouldReceive('deleteTime')->once()->with($time)->andReturnNull();
        $this->service->deleteTime($time);
        $this->assertTrue(true);
    }

    public function test_get_consultant_times_builds_filters_and_delegates(): void
    {
        $consultant = new Consultant();
        $consultant->id = 12;
        $collection = new Collection();

        $captured = null;
        $this->repo->shouldReceive('listTimes')->once()->andReturnUsing(function ($args) use (&$captured, $collection) {
            $captured = $args;
            return $collection;
        });

        $result = $this->service->getConsultantTimes($consultant, [
            'startDate' => '2026-06-01',
            'endDate'   => '2026-06-30',
        ]);

        $this->assertSame($collection, $result);
        $this->assertSame(12, $captured['filters']['consultant_id']);
        $this->assertArrayHasKey('betweenDate', $captured['filters']);
    }
}
