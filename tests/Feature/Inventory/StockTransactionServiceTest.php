<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\TransactionHistory;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Services\StockMutationService;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class StockTransactionServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Store $store;
    private Item $item;
    private Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->unit = Unit::create(['name' => 'Box', 'abbreviation' => 'box']);

        $this->store = Store::create(['name' => 'Test Store', 'code' => 'TST', 'is_active' => true]);

        $this->item = Item::create([
            'item_code'         => 'I-TX-001',
            'name'              => 'Transaction Item',
            'department'        => 'LAB',
            'material_type'     => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id'   => $this->unit->id,
            'is_active'         => true,
        ]);
    }

    private function makePendingTransaction(): StockTransaction
    {
        $tx = StockTransaction::create([
            'transaction_type'     => TransactionType::EXPORT->value,
            'reference_number'     => 'EXP-TEST-' . uniqid(),
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::PENDING_APPROVAL->value,
        ]);

        StockTransactionLine::create([
            'transaction_id'      => $tx->id,
            'item_id'             => $this->item->id,
            'unit_id'             => $this->unit->id,
            'quantity'            => 5,
            'quantity_base_units' => 5,
        ]);

        return $tx->load('lines.item');
    }

    private function makeDraftTransaction(): StockTransaction
    {
        $tx = StockTransaction::create([
            'transaction_type'     => TransactionType::EXPORT->value,
            'reference_number'     => 'EXP-DFT-' . uniqid(),
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => TransactionStatus::DRAFT->value,
        ]);

        StockTransactionLine::create([
            'transaction_id'      => $tx->id,
            'item_id'             => $this->item->id,
            'unit_id'             => $this->unit->id,
            'quantity'            => 5,
            'quantity_base_units' => 5,
        ]);

        return $tx->load('lines.item');
    }

    // -------------------------------------------------------------------------
    // I-11: approve() throws when validateStock returns shortages
    // -------------------------------------------------------------------------

    public function test_approve_transaction_throws_when_stock_insufficient(): void
    {
        $tx = $this->makePendingTransaction();

        // Mock mutation service so validateStock reports a shortage
        $mutationMock = $this->mock(StockMutationService::class);
        $mutationMock->shouldReceive('validateStock')
            ->once()
            ->andReturn(['• Transaction Item: needed 5, available 0']);

        $service = app(StockTransactionService::class);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/insufficient stock/i');

        $service->approve($tx);
    }

    // -------------------------------------------------------------------------
    // I-12: approve() applies mutation and logs APPROVED history record
    // -------------------------------------------------------------------------

    public function test_approve_transaction_applies_mutation_and_logs_approved(): void
    {
        $tx = $this->makePendingTransaction();

        $mutationMock = $this->mock(StockMutationService::class);
        $mutationMock->shouldReceive('validateStock')->once()->andReturn([]);
        $mutationMock->shouldReceive('apply')->once()->andReturnNull();

        $service = app(StockTransactionService::class);
        $approved = $service->approve($tx);

        $this->assertEquals(TransactionStatus::APPROVED, $approved->fresh()->status);

        $this->assertDatabaseHas('transaction_histories', [
            'transaction_id' => $tx->id,
            'event'          => 'APPROVED',
        ]);
    }

    // -------------------------------------------------------------------------
    // I-13: submitForApproval() throws when transaction is not DRAFT
    // -------------------------------------------------------------------------

    public function test_submit_for_approval_requires_draft_status(): void
    {
        // Create a PENDING_APPROVAL transaction (not DRAFT)
        $tx = $this->makePendingTransaction();

        $service = app(StockTransactionService::class);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/DRAFT/');

        $service->submitForApproval($tx);
    }

    public function test_submit_for_approval_transitions_draft_to_pending(): void
    {
        $tx = $this->makeDraftTransaction();

        $service = app(StockTransactionService::class);
        $service->submitForApproval($tx);

        $this->assertEquals(TransactionStatus::PENDING_APPROVAL, $tx->fresh()->status);
    }
}
