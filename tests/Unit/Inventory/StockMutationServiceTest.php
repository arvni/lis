<?php

namespace Tests\Unit\Inventory;

use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Repositories\StockLotRepository;
use App\Domains\Inventory\Services\ReorderAlertService;
use App\Domains\Inventory\Services\StockMutationService;
use Mockery;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Pure-logic coverage for StockMutationService's non-mutating helpers:
 * barcode derivation and the outbound stock-availability check. The DB-bound
 * apply*() FIFO paths are covered by the Feature test
 * (tests/Feature/Inventory/StockMutationServiceTest.php); here the lot lookups
 * are stubbed so the branch logic is exercised without touching the database.
 */
class StockMutationServiceTest extends TestCase
{
    private StockLotRepository $lotRepository;

    private StockMutationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->lotRepository = Mockery::mock(StockLotRepository::class);
        $reorderAlerts = Mockery::mock(ReorderAlertService::class);
        $this->service = new StockMutationService($this->lotRepository, $reorderAlerts);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @param mixed ...$args */
    private function invoke(string $method, ...$args): mixed
    {
        $ref = new ReflectionMethod(StockMutationService::class, $method);
        $ref->setAccessible(true);

        return $ref->invoke($this->service, ...$args);
    }

    private function line(array $attrs, ?Item $item = null): StockTransactionLine
    {
        $line = new StockTransactionLine;
        foreach ($attrs as $key => $value) {
            $line->{$key} = $value;
        }
        // Always set the relation so accessing $line->item never lazy-loads from the DB.
        $line->setRelation('item', $item);

        return $line;
    }

    // ---------------------------------------------------------------------
    // generateBarcode — "{itemCode}-{brandSlug|txId}".
    // ---------------------------------------------------------------------

    public function test_generate_barcode_uses_item_code_and_brand_slug(): void
    {
        $line = $this->line(['item_id' => 1, 'brand' => 'Bayer HealthCare'], new Item(['item_code' => 'RGT001']));

        $this->assertSame('RGT001-BAYER-HEALTHCARE', $this->invoke('generateBarcode', $line, 55));
    }

    public function test_generate_barcode_collapses_repeated_whitespace_in_brand(): void
    {
        $line = $this->line(['item_id' => 1, 'brand' => '  roche   dia  '], new Item(['item_code' => 'RGT002']));

        $this->assertSame('RGT002-ROCHE-DIA', $this->invoke('generateBarcode', $line, 55));
    }

    public function test_generate_barcode_falls_back_to_tx_id_without_brand(): void
    {
        $line = $this->line(['item_id' => 1, 'brand' => null], new Item(['item_code' => 'RGT003']));

        $this->assertSame('RGT003-55', $this->invoke('generateBarcode', $line, 55));
    }

    public function test_generate_barcode_falls_back_to_item_id_without_item_code(): void
    {
        // Item present but no item_code → "ITEM{item_id}" prefix.
        $line = $this->line(['item_id' => 42, 'brand' => null], new Item);

        $this->assertSame('ITEM42-55', $this->invoke('generateBarcode', $line, 55));
    }

    // ---------------------------------------------------------------------
    // validateStock — only outbound types check availability; reports shortages.
    // ---------------------------------------------------------------------

    public function test_validate_stock_skips_inbound_transaction_types(): void
    {
        foreach ([TransactionType::ENTRY, TransactionType::RETURN, TransactionType::ADJUST] as $type) {
            // Never consults the repository for inbound/adjust types.
            $this->lotRepository->shouldNotReceive('getTotalStockInStore');
            $tx = $this->transaction($type, [
                $this->line(['item_id' => 1, 'quantity_base_units' => 100], new Item(['name' => 'Reagent A'])),
            ]);

            $this->assertSame([], $this->service->validateStock($tx));
        }
    }

    public function test_validate_stock_reports_shortage_for_export(): void
    {
        $this->lotRepository->shouldReceive('getTotalStockInStore')
            ->with(1, 9)->andReturn('30');

        $tx = $this->transaction(TransactionType::EXPORT, [
            $this->line(['item_id' => 1, 'quantity_base_units' => 100], new Item(['name' => 'Reagent A'])),
        ]);

        $shortages = $this->service->validateStock($tx);

        $this->assertCount(1, $shortages);
        $this->assertStringContainsString('Reagent A', $shortages[0]);
        $this->assertStringContainsString('needed 100', $shortages[0]);
        $this->assertStringContainsString('available 30', $shortages[0]);
    }

    public function test_validate_stock_is_empty_when_supply_meets_demand(): void
    {
        $this->lotRepository->shouldReceive('getTotalStockInStore')
            ->with(1, 9)->andReturn('100');

        $tx = $this->transaction(TransactionType::TRANSFER, [
            $this->line(['item_id' => 1, 'quantity_base_units' => 100], new Item(['name' => 'Reagent A'])),
        ]);

        $this->assertSame([], $this->service->validateStock($tx));
    }

    public function test_validate_stock_labels_shortage_by_item_id_without_item_name(): void
    {
        $this->lotRepository->shouldReceive('getTotalStockInStore')
            ->with(7, 9)->andReturn('0');

        $tx = $this->transaction(TransactionType::EXPIRED_REMOVAL, [
            $this->line(['item_id' => 7, 'quantity_base_units' => 5], new Item),
        ]);

        $shortages = $this->service->validateStock($tx);

        $this->assertStringContainsString('Item #7', $shortages[0]);
    }

    /**
     * @param  array<int, StockTransactionLine>  $lines
     */
    private function transaction(TransactionType $type, array $lines): StockTransaction
    {
        $tx = new StockTransaction;
        $tx->transaction_type = $type;
        $tx->store_id = 9;
        // Pre-set the relation so loadMissing('lines.item') is a no-op (no DB).
        $tx->setRelation('lines', collect($lines));

        return $tx;
    }
}
