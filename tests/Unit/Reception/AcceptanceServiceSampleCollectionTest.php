<?php

namespace Tests\Unit\Reception;

use App\Domains\Reception\Adapters\LaboratoryAdapter;
use App\Domains\Reception\Adapters\ReferrerAdapter;
use App\Domains\Reception\Adapters\SettingAdapter;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Reception\Services\AcceptanceService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Tests\TestCase;

/**
 * Verifies listSampleCollections() resolves the min-payment threshold through the
 * Reception SettingAdapter (the cross-domain boundary) and forwards it to the
 * repository, instead of the repository reaching into Setting's service directly.
 * Pure-unit: every collaborator is mocked, no DB.
 */
class AcceptanceServiceSampleCollectionTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    public function test_reads_min_payment_via_adapter_and_forwards_it_to_the_repository(): void
    {
        $queryData = ['filters' => ['status' => 'pending']];
        $paginator = Mockery::mock(LengthAwarePaginator::class);

        $settingAdapter = Mockery::mock(SettingAdapter::class);
        $settingAdapter->shouldReceive('getSettingByClassAndKey')
            ->once()->with('Payment', 'minPayment')->andReturn('40');

        $repository = Mockery::mock(AcceptanceRepository::class);
        $repository->shouldReceive('listSampleCollection')
            ->once()
            ->with($queryData, 40.0)
            ->andReturn($paginator);

        $service = new AcceptanceService(
            $repository,
            Mockery::mock(AcceptanceItemService::class),
            Mockery::mock(LaboratoryAdapter::class),
            $settingAdapter,
            Mockery::mock(ReferrerAdapter::class),
        );

        $this->assertSame($paginator, $service->listSampleCollections($queryData));
    }

    public function test_casts_missing_setting_to_zero_threshold(): void
    {
        $queryData = [];
        $paginator = Mockery::mock(LengthAwarePaginator::class);

        $settingAdapter = Mockery::mock(SettingAdapter::class);
        $settingAdapter->shouldReceive('getSettingByClassAndKey')
            ->once()->with('Payment', 'minPayment')->andReturnNull();

        $repository = Mockery::mock(AcceptanceRepository::class);
        $repository->shouldReceive('listSampleCollection')
            ->once()
            ->with($queryData, 0.0)
            ->andReturn($paginator);

        $service = new AcceptanceService(
            $repository,
            Mockery::mock(AcceptanceItemService::class),
            Mockery::mock(LaboratoryAdapter::class),
            $settingAdapter,
            Mockery::mock(ReferrerAdapter::class),
        );

        $this->assertSame($paginator, $service->listSampleCollections($queryData));
    }
}
