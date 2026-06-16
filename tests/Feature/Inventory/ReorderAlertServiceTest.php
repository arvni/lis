<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\ReorderAlert;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Repositories\ReorderAlertRepository;
use App\Domains\Inventory\Services\ReorderAlertService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Mockery;
use Tests\TestCase;

class ReorderAlertServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReorderAlertRepository $repo;
    private ReorderAlertService $service;
    private Store $store;
    private Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->repo = Mockery::mock(ReorderAlertRepository::class);
        $this->service = new ReorderAlertService($this->repo);
        $this->store = Store::create(['name' => 'S', 'code' => 'S', 'is_active' => true]);
        $this->unit = Unit::create(['name' => 'u', 'abbreviation' => 'u']);
    }

    private function makeItem(float $minLevel): Item
    {
        return Item::create([
            'item_code'            => 'I-' . uniqid(),
            'name'                 => 'Reagent',
            'department'           => 'LAB',
            'material_type'        => 'RGT',
            'storage_condition'    => 'ROOM_TEMP',
            'default_unit_id'      => $this->unit->id,
            'is_active'            => true,
            'minimum_stock_level'  => $minLevel,
        ]);
    }

    private function makeLot(Item $item, float $qty): void
    {
        StockLot::create([
            'item_id'             => $item->id,
            'store_id'            => $this->store->id,
            'status'             => 'ACTIVE',
            'quantity_base_units' => $qty,
            'lot_number'         => 'L' . uniqid(),
            'received_date'      => now()->toDateString(),
        ]);
    }

    public function test_no_alert_when_item_missing(): void
    {
        $this->repo->shouldNotReceive('upsertAlert');
        $this->service->checkAndAlert(99999, $this->store->id);
        $this->assertTrue(true);
    }

    public function test_no_alert_when_minimum_level_not_set(): void
    {
        $item = $this->makeItem(0);
        $this->repo->shouldNotReceive('upsertAlert');
        $this->service->checkAndAlert($item->id, $this->store->id);
        $this->assertTrue(true);
    }

    public function test_no_alert_when_stock_sufficient(): void
    {
        $item = $this->makeItem(10);
        $this->makeLot($item, 25);
        $this->repo->shouldNotReceive('upsertAlert');
        $this->service->checkAndAlert($item->id, $this->store->id);
        $this->assertTrue(true);
    }

    public function test_upserts_alert_when_below_minimum(): void
    {
        $item = $this->makeItem(10);
        $this->makeLot($item, 3);

        $alert = new ReorderAlert();
        $alert->wasRecentlyCreated = false; // suppress notification path
        $this->repo->shouldReceive('upsertAlert')->once()
            ->with($item->id, $this->store->id, 3.0, 10.0)
            ->andReturn($alert);

        $this->service->checkAndAlert($item->id, $this->store->id);

        Notification::assertNothingSent();
    }
}
