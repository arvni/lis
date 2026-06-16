<?php

namespace Tests\Feature\Consultation;

use App\Domains\Consultation\DTOs\ConsultantDTO;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Repositories\ConsultantRepository;
use App\Domains\Consultation\Services\ConsultantService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class ConsultantServiceTest extends TestCase
{
    private ConsultantRepository $repo;
    private ConsultantService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
        $this->repo = Mockery::mock(ConsultantRepository::class);
        $this->service = new ConsultantService($this->repo);
    }

    private function dto($avatar = null): ConsultantDTO
    {
        $dto = Mockery::mock(ConsultantDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['name' => 'Dr A', 'avatar' => $avatar]);
        $dto->avatar = $avatar;
        return $dto;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('all')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listConsultants([]));
    }

    public function test_create_persists_without_avatar_id(): void
    {
        // avatar without an 'id' key → stored as-is (string path), no document event.
        $consultant = Mockery::mock(Consultant::class)->makePartial();
        $consultant->shouldReceive('isDirty')->andReturn(false);
        $this->repo->shouldReceive('create')->once()->andReturn($consultant);

        $result = $this->service->createConsultant($this->dto(['id' => null]));
        $this->assertSame($consultant, $result);
    }

    public function test_update_delegates(): void
    {
        $consultant = Mockery::mock(Consultant::class)->makePartial();
        $consultant->shouldReceive('isDirty')->andReturn(false);
        $this->repo->shouldReceive('update')->once()->andReturn($consultant);

        $result = $this->service->updateConsultant($consultant, $this->dto(null));
        $this->assertSame($consultant, $result);
    }

    public function test_delete_delegates(): void
    {
        $consultant = new Consultant();
        $this->repo->shouldReceive('delete')->once()->with($consultant)->andReturnNull();
        $this->service->deleteConsultant($consultant);
        $this->assertTrue(true);
    }

    public function test_load_relation_loads_user_and_counts(): void
    {
        $consultant = Mockery::mock(Consultant::class)->makePartial();
        $consultant->shouldReceive('load')->once()->with(['user'])->andReturnSelf();
        $consultant->shouldReceive('loadCount')->once()->andReturnSelf();

        $this->assertSame($consultant, $this->service->loadConsultantRelation($consultant));
    }
}
