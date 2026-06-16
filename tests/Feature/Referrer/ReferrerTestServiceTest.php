<?php

namespace Tests\Feature\Referrer;

use App\Domains\Referrer\DTOs\ReferrerTestDTO;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerTest;
use App\Domains\Referrer\Repositories\ReferrerTestRepository;
use App\Domains\Referrer\Services\ReferrerTestService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class ReferrerTestServiceTest extends TestCase
{
    private ReferrerTestRepository $repo;
    private ReferrerTestService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(ReferrerTestRepository::class);
        $this->service = new ReferrerTestService($this->repo);
    }

    private function dto(array $data = ['test_id' => 1]): ReferrerTestDTO
    {
        $dto = Mockery::mock(ReferrerTestDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    public function test_index_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('index')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->index([]));
    }

    public function test_find_by_id_delegates(): void
    {
        $rt = new ReferrerTest();
        $this->repo->shouldReceive('findById')->once()->with(3)->andReturn($rt);
        $this->assertSame($rt, $this->service->findById(3));
    }

    public function test_store_delegates(): void
    {
        $rt = new ReferrerTest();
        $this->repo->shouldReceive('store')->once()->with(['test_id' => 1])->andReturn($rt);
        $this->assertSame($rt, $this->service->store($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $rt = new ReferrerTest();
        $this->repo->shouldReceive('update')->once()->with($rt, ['test_id' => 1])->andReturn($rt);
        $this->assertSame($rt, $this->service->update($rt, $this->dto()));
    }

    public function test_delete_delegates(): void
    {
        $rt = new ReferrerTest();
        $this->repo->shouldReceive('delete')->once()->with($rt)->andReturn(true);
        $this->assertTrue($this->service->delete($rt));
    }

    public function test_calculate_conditional_price_returns_matched_value(): void
    {
        $price = $this->service->calculateConditionalPrice([
            'parameters' => [
                ['id' => 'A7Wmfw', 'value' => 5],
                ['id' => 'HZIcwd', 'value' => 3],
            ],
            'conditions' => [
                ['condition' => '$p1 > $p2', 'value' => '$p1 * 10'],
            ],
        ]);

        $this->assertSame(50.0, $price);
    }

    public function test_calculate_conditional_price_zero_when_no_condition_matches(): void
    {
        $price = $this->service->calculateConditionalPrice([
            'parameters' => [
                ['id' => 'A7Wmfw', 'value' => 1],
                ['id' => 'HZIcwd', 'value' => 9],
            ],
            'conditions' => [
                ['condition' => '$p1 > $p2', 'value' => '$p1 * 10'],
            ],
        ]);

        $this->assertSame(0.0, $price);
    }

    public function test_copy_from_other_referrer_stores_missing_tests(): void
    {
        $sourceTest = new ReferrerTest(['test_id' => 10, 'price' => 25, 'methods' => []]);

        $source = Mockery::mock(Referrer::class)->makePartial();
        $source->shouldReceive('load')->with('referrerTests')->andReturnSelf();
        $source->setRelation('referrerTests', new Collection([$sourceTest]));

        $target = Mockery::mock(Referrer::class)->makePartial();
        $target->id = 99;
        $target->shouldReceive('load')->with('referrerTests')->andReturnSelf();
        $target->setRelation('referrerTests', new Collection());

        $this->repo->shouldReceive('store')->once()
            ->with(Mockery::on(fn($a) => $a['test_id'] === 10 && $a['referrer_id'] === 99))
            ->andReturn(new ReferrerTest());

        $this->service->copyFromOtherReferrer($source, $target);
        $this->assertTrue(true);
    }
}
