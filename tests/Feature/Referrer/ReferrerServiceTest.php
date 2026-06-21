<?php

namespace Tests\Feature\Referrer;

use App\Domains\Referrer\DTOs\ReferrerDTO;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Repositories\ReferrerRepository;
use App\Domains\Referrer\Services\ReferrerService;
use App\Domains\User\Models\User;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class ReferrerServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReferrerRepository $repo;
    private ReferrerService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->repo = Mockery::mock(ReferrerRepository::class);
        $this->service = new ReferrerService($this->repo);
    }

    private function dto(array $data = ['fullName' => 'Dr Ref']): ReferrerDTO
    {
        $dto = Mockery::mock(ReferrerDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    private function referrerWith(bool $acc, bool $orders): Referrer
    {
        $accRel = Mockery::mock();
        $accRel->shouldReceive('exists')->andReturn($acc);
        $ordersRel = Mockery::mock();
        $ordersRel->shouldReceive('exists')->andReturn($orders);
        $referrer = Mockery::mock(Referrer::class)->makePartial();
        $referrer->shouldReceive('acceptances')->andReturn($accRel);
        $referrer->shouldReceive('referrerOrders')->andReturn($ordersRel);
        return $referrer;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listReferrer')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listReferrers([]));
    }

    public function test_create_delegates(): void
    {
        $referrer = new Referrer();
        $this->repo->shouldReceive('createReferrer')->once()->with(['fullName' => 'Dr Ref'])->andReturn($referrer);
        $this->assertSame($referrer, $this->service->createReferrer($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $referrer = new Referrer();
        $this->repo->shouldReceive('updateReferrer')->once()->with($referrer, ['fullName' => 'Dr Ref'])->andReturn($referrer);
        $this->assertSame($referrer, $this->service->updateReferrer($referrer, $this->dto()));
    }

    public function test_get_by_email_delegates(): void
    {
        $referrer = new Referrer();
        $this->repo->shouldReceive('findReferrerByEmail')->once()->with('a@b.c')->andReturn($referrer);
        $this->assertSame($referrer, $this->service->getReferrerByEmail('a@b.c'));
    }

    public function test_get_by_id_delegates(): void
    {
        $referrer = new Referrer();
        $this->repo->shouldReceive('findReferrerById')->once()->with(5)->andReturn($referrer);
        $this->assertSame($referrer, $this->service->getReferrerById(5));
    }

    public function test_delete_removes_referrer_without_associations(): void
    {
        $referrer = $this->referrerWith(acc: false, orders: false);
        $this->repo->shouldReceive('deleteReferrer')->once()->with($referrer)->andReturnNull();
        $this->service->deleteReferrer($referrer);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_referrer_has_acceptances(): void
    {
        $referrer = $this->referrerWith(acc: true, orders: false);
        $this->repo->shouldNotReceive('deleteReferrer');
        $this->expectException(Exception::class);
        $this->service->deleteReferrer($referrer);
    }

    public function test_get_referrer_details_returns_structure(): void
    {
        $referrer = Referrer::create([
            'fullName'        => 'Dr Detail',
            'phoneNo'         => '90000000',
            'billingInfo'     => [],
            'email'           => 'd@e.f',
            'reportReceivers' => [],
        ]);

        $details = (app(ReferrerService::class))->getReferrerDetails($referrer);

        $this->assertArrayHasKey('referrer', $details);
        $this->assertArrayHasKey('referrerOrders', $details);
        $this->assertArrayHasKey('invoices', $details);
        $this->assertSame($referrer->id, $details['referrer']->id);
    }
}
