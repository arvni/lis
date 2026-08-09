<?php

namespace Tests\Feature\Reception;

use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\ReportRepository;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Tests\TestCase;

class AcceptanceItemServiceTest extends TestCase
{
    private AcceptanceItemRepository $itemRepo;
    private ReportRepository $reportRepo;
    private AcceptanceItemService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->itemRepo = Mockery::mock(AcceptanceItemRepository::class);
        $this->reportRepo = Mockery::mock(ReportRepository::class);
        $this->service = new AcceptanceItemService($this->itemRepo, $this->reportRepo);
    }

    private function makeDTO(array $overrides = []): AcceptanceItemDTO
    {
        return new AcceptanceItemDTO(
            acceptanceId: $overrides['acceptanceId'] ?? 1,
            methodTestId: $overrides['methodTestId'] ?? 2,
            price: $overrides['price'] ?? 50.0,
            discount: $overrides['discount'] ?? 0.0,
            customParameters: [],
            timeline: $overrides['timeline'] ?? [],
            id: $overrides['id'] ?? 99,
        );
    }

    public function test_list_acceptance_items_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->itemRepo->shouldReceive('listAcceptanceItems')->once()->with(['q' => 1])->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listAcceptanceItems(['q' => 1]));
    }

    public function test_export_acceptance_items_delegates(): void
    {
        $collection = new Collection();
        $this->itemRepo->shouldReceive('listAllAcceptanceItems')->once()->andReturn($collection);
        $this->assertSame($collection, $this->service->exportAcceptanceItems([]));
    }

    public function test_list_ready_report_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->itemRepo->shouldReceive('listAcceptanceItemsReadyReport')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listAcceptanceItemsReadyReport([]));
    }

    public function test_store_acceptance_item_strips_id_before_persisting(): void
    {
        $captured = null;
        $this->itemRepo->shouldReceive('creatAcceptanceItem')->once()->andReturnUsing(function ($data) use (&$captured) {
            $captured = $data;
            return new AcceptanceItem();
        });

        $this->service->storeAcceptanceItem($this->makeDTO(['id' => 99]));

        $this->assertArrayNotHasKey('id', $captured);
        $this->assertSame(1, $captured['acceptance_id']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // addItemsToExistingAcceptance (referrer-order pooling into an existing acceptance)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Record every payload the repository is asked to persist.
     *
     * @param  array<int, array<string, mixed>>  $captured
     */
    private function captureCreatedItems(int $times, array &$captured): void
    {
        $this->itemRepo->shouldReceive('creatAcceptanceItem')
            ->times($times)
            ->andReturnUsing(function ($data) use (&$captured) {
                $captured[] = $data;

                return new AcceptanceItem();
            });
    }

    private function bareAcceptance(int $id = 7): Acceptance
    {
        $acceptance = new Acceptance();
        $acceptance->setRawAttributes(['id' => $id]);

        return $acceptance;
    }

    public function test_add_items_to_existing_acceptance_keeps_submitted_test_flags(): void
    {
        $this->actingAs(User::factory()->make(['name' => 'Receptionist']));
        $captured = [];
        $this->captureCreatedItems(1, $captured);

        $this->service->addItemsToExistingAcceptance($this->bareAcceptance(), [
            'tests' => [
                ['method_test' => ['id' => 3], 'price' => 120, 'discount' => 20, 'sampleless' => true],
                ['method_test' => ['id' => 4], 'price' => 50, 'deleted' => true],
            ],
        ]);

        $this->assertCount(1, $captured, 'a deleted item is skipped');
        $this->assertSame(7, $captured[0]['acceptance_id']);
        $this->assertSame(120.0, $captured[0]['price']);
        $this->assertSame(20.0, $captured[0]['discount']);
        $this->assertTrue($captured[0]['sampleless']);
        $this->assertStringContainsString(
            'Created By Receptionist (Pooling)',
            implode(' ', $captured[0]['timeline'])
        );
    }

    public function test_add_items_to_existing_acceptance_splits_panel_totals_and_shares_a_panel_id(): void
    {
        $this->actingAs(User::factory()->make(['name' => 'Receptionist']));
        $captured = [];
        $this->captureCreatedItems(3, $captured);

        $this->service->addItemsToExistingAcceptance($this->bareAcceptance(), [
            'panels' => [[
                'price' => 100,
                'discount' => 10,
                'reportless' => true,
                'acceptanceItems' => [
                    ['method_test' => ['id' => 1]],
                    ['method_test' => ['id' => 2]],
                    ['method_test' => ['id' => 3]],
                ],
            ]],
        ]);

        $this->assertCount(3, $captured);
        // 100 over three items does not divide evenly, but the shares must still
        // add back up to the panel total.
        $this->assertEqualsWithDelta(100.0, array_sum(array_column($captured, 'price')), 0.001);
        $this->assertEqualsWithDelta(10.0, array_sum(array_column($captured, 'discount')), 0.001);
        $this->assertCount(1, array_unique(array_map(
            fn (array $item) => (string) $item['panel_id'],
            $captured
        )), 'all panel items share one panel_id');
        $this->assertTrue($captured[0]['reportless'], 'the panel-level reportless flag reaches its items');
    }

    public function test_update_acceptance_item_delegates(): void
    {
        $item = new AcceptanceItem();
        $this->itemRepo->shouldReceive('updateAcceptanceItem')->once()->andReturn($item);
        $this->assertSame($item, $this->service->updateAcceptanceItem($item, $this->makeDTO()));
    }

    public function test_find_acceptance_item_by_id_delegates(): void
    {
        $item = new AcceptanceItem();
        $this->itemRepo->shouldReceive('findAcceptanceItemById')->once()->with(5)->andReturn($item);
        $this->assertSame($item, $this->service->findAcceptanceItemById(5));
    }

    public function test_delete_acceptance_item_delegates(): void
    {
        $item = new AcceptanceItem();
        $this->itemRepo->shouldReceive('deleteAcceptanceItem')->once()->with($item)->andReturnNull();
        $this->service->deleteAcceptanceItem($item);
        $this->assertTrue(true);
    }

    public function test_update_timeline_appends_message_to_array(): void
    {
        $item = new AcceptanceItem(['timeline' => ['2020-01-01 00:00:00' => 'created']]);

        $captured = null;
        $this->itemRepo->shouldReceive('updateAcceptanceItem')->once()->andReturnUsing(function ($i, $data) use (&$captured) {
            $captured = $data;
            return $i;
        });

        $this->service->updateAcceptanceItemTimeline($item, 'new event');

        $this->assertContains('new event', $captured['timeline']);
        $this->assertContains('created', $captured['timeline']);
    }

    public function test_update_timeline_decodes_string_timeline(): void
    {
        $item = new AcceptanceItem();
        $item->setRawAttributes(['timeline' => json_encode(['2020-01-01 00:00:00' => 'created'])]);

        $captured = null;
        $this->itemRepo->shouldReceive('updateAcceptanceItem')->once()->andReturnUsing(function ($i, $data) use (&$captured) {
            $captured = $data;
            return $i;
        });

        $this->service->updateAcceptanceItemTimeline($item, 'second');

        $this->assertContains('created', $captured['timeline']);
        $this->assertContains('second', $captured['timeline']);
    }

    public function test_get_report_history_resolves_item_then_history(): void
    {
        $item = new AcceptanceItem();
        $history = new Collection();
        $this->itemRepo->shouldReceive('findAcceptanceItemById')->once()->with(7)->andReturn($item);
        $this->reportRepo->shouldReceive('getHistoryForAcceptanceItem')->once()->with($item)->andReturn($history);

        $this->assertSame($history, $this->service->getReportHistory(7));
    }

    /**
     * Build a mocked Acceptance whose acceptanceItems()->get() returns the
     * given items, so updateItemPrices can be exercised without a database.
     */
    private function acceptanceWithItems(array $items): Acceptance
    {
        $relation = Mockery::mock(HasMany::class);
        $relation->shouldReceive('get')->once()->andReturn(new Collection($items));

        $acceptance = Mockery::mock(Acceptance::class)->makePartial();
        $acceptance->setRawAttributes(['id' => 1]);
        $acceptance->shouldReceive('acceptanceItems')->once()->andReturn($relation);

        return $acceptance;
    }

    public function test_update_item_prices_persists_changed_price_discount_and_timeline(): void
    {
        $this->actingAs(User::factory()->make(['name' => 'Cashier']));

        $item = new AcceptanceItem();
        $item->setRawAttributes(['id' => 5, 'price' => 100, 'discount' => 0, 'timeline' => '[]']);
        $acceptance = $this->acceptanceWithItems([$item]);

        $captured = null;
        $this->itemRepo->shouldReceive('updateAcceptanceItem')->once()->andReturnUsing(function ($i, $data) use (&$captured) {
            $captured = $data;
            return $i;
        });

        $this->service->updateItemPrices($acceptance, [
            ['id' => 5, 'price' => 80, 'discount' => 10],
        ]);

        $this->assertSame(80.0, $captured['price']);
        $this->assertSame(10.0, $captured['discount']);
        $this->assertStringContainsString(
            'Price set to 80 and discount to 10 by Cashier',
            implode(' ', $captured['timeline'])
        );
    }

    public function test_update_item_prices_skips_unchanged_item(): void
    {
        $this->actingAs(User::factory()->make(['name' => 'Cashier']));

        $item = new AcceptanceItem();
        $item->setRawAttributes(['id' => 5, 'price' => 100, 'discount' => 0, 'timeline' => '[]']);
        $acceptance = $this->acceptanceWithItems([$item]);

        $this->itemRepo->shouldReceive('updateAcceptanceItem')->never();

        $this->service->updateItemPrices($acceptance, [
            ['id' => 5, 'price' => 100, 'discount' => 0],
        ]);

        $this->assertTrue(true);
    }

    public function test_update_item_prices_ignores_unknown_item_ids(): void
    {
        $this->actingAs(User::factory()->make(['name' => 'Cashier']));

        $item = new AcceptanceItem();
        $item->setRawAttributes(['id' => 5, 'price' => 100, 'discount' => 0, 'timeline' => '[]']);
        $acceptance = $this->acceptanceWithItems([$item]);

        $this->itemRepo->shouldReceive('updateAcceptanceItem')->never();

        $this->service->updateItemPrices($acceptance, [
            ['id' => 999, 'price' => 1, 'discount' => 0],
        ]);

        $this->assertTrue(true);
    }

    public function test_reject_sample_deactivates_link_and_logs_timeline(): void
    {
        $this->actingAs(User::factory()->make(['name' => 'Tech']));

        $relation = Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $relation->shouldReceive('where')->once()->with('sample_id', 33)->andReturnSelf();
        $relation->shouldReceive('update')->once()->with(['active' => false])->andReturn(1);

        $item = Mockery::mock(AcceptanceItem::class)->makePartial();
        $item->setRawAttributes(['timeline' => '[]']);
        $item->shouldReceive('acceptanceItemSamples')->once()->andReturn($relation);

        $captured = null;
        $this->itemRepo->shouldReceive('updateAcceptanceItem')->once()->andReturnUsing(function ($i, $data) use (&$captured) {
            $captured = $data;
            return $i;
        });

        $this->service->rejectSample($item, 33);

        $this->assertStringContainsString('Rejected For Resampling By Tech', implode(' ', $captured['timeline']));
    }
}
