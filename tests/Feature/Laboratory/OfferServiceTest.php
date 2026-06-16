<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\OfferDTO;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\Laboratory\Repositories\OfferRepository;
use App\Domains\Laboratory\Services\OfferService;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class OfferServiceTest extends TestCase
{
    private OfferRepository $repo;
    private OfferService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(OfferRepository::class);
        $this->service = new OfferService($this->repo);
    }

    private function dto(array $tests = [], array $referrers = []): OfferDTO
    {
        $dto = Mockery::mock(OfferDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['name' => 'Promo']);
        $dto->tests = $tests;
        $dto->referrers = $referrers;
        return $dto;
    }

    private function offerWithSyncRelations(): Offer
    {
        $testsRel = Mockery::mock(\Illuminate\Database\Eloquent\Relations\BelongsToMany::class);
        $testsRel->shouldReceive('sync')->andReturn([]);
        $referrersRel = Mockery::mock(\Illuminate\Database\Eloquent\Relations\BelongsToMany::class);
        $referrersRel->shouldReceive('sync')->andReturn([]);

        $offer = Mockery::mock(Offer::class)->makePartial();
        $offer->shouldReceive('tests')->andReturn($testsRel);
        $offer->shouldReceive('referrers')->andReturn($referrersRel);
        return $offer;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListOffers')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listOffers([]));
    }

    public function test_store_creates_and_syncs_tests_and_referrers(): void
    {
        $offer = $this->offerWithSyncRelations();
        $this->repo->shouldReceive('creatOffer')->once()->with(['name' => 'Promo'])->andReturn($offer);

        $result = $this->service->storeOffer($this->dto([['id' => 1]], [['id' => 2]]));
        $this->assertSame($offer, $result);
    }

    public function test_update_updates_and_syncs(): void
    {
        $offer = $this->offerWithSyncRelations();
        $this->repo->shouldReceive('updateOffer')->once()->andReturn($offer);

        $result = $this->service->updateOffer($offer, $this->dto([['id' => 1]], []));
        $this->assertSame($offer, $result);
    }

    public function test_delete_delegates(): void
    {
        $offer = new Offer();
        $this->repo->shouldReceive('deleteOffer')->once()->with($offer)->andReturnNull();
        $this->service->deleteOffer($offer);
        $this->assertTrue(true);
    }

    public function test_sync_tests_plucks_ids(): void
    {
        $rel = Mockery::mock(\Illuminate\Database\Eloquent\Relations\BelongsToMany::class);
        $rel->shouldReceive('sync')->once()->with([7, 8])->andReturn([]);
        $offer = Mockery::mock(Offer::class)->makePartial();
        $offer->shouldReceive('tests')->once()->andReturn($rel);

        $this->service->syncTests($offer, [['id' => 7], ['id' => 8]]);
        $this->assertTrue(true);
    }

    public function test_sync_referrers_plucks_ids(): void
    {
        $rel = Mockery::mock(\Illuminate\Database\Eloquent\Relations\BelongsToMany::class);
        $rel->shouldReceive('sync')->once()->with([3])->andReturn([]);
        $offer = Mockery::mock(Offer::class)->makePartial();
        $offer->shouldReceive('referrers')->once()->andReturn($rel);

        $this->service->syncReferrers($offer, [['id' => 3]]);
        $this->assertTrue(true);
    }
}
