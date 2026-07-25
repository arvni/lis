<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\TransactionStatus;
use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Exports\StockTransactionsExport;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\StockTransactionLine;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Unit;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The stock-transactions export streams an Excel download of the transaction
 * LINES (one row per line) for whatever filters the transactions list is showing,
 * gated on the same `viewAny` ability as the list itself.
 */
class StockTransactionsExportTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Inventory.Transactions.List Transactions';

    private User $user;

    private Store $store;

    private Item $item;

    private Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->unit = Unit::create(['name' => 'Box', 'abbreviation' => 'box']);
        $this->store = Store::create(['name' => 'Test Store', 'code' => 'TST', 'is_active' => true]);
        $this->item = Item::create([
            'item_code' => 'I-TX-001',
            'name' => 'Transaction Item',
            'department' => 'LAB',
            'material_type' => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $this->unit->id,
            'is_active' => true,
        ]);
    }

    public function test_export_forbidden_without_permission(): void
    {
        $this->makeTransaction(TransactionType::EXPORT, lineCount: 1);

        $this->actingAs($this->user)
            ->get(route('inventory.transactions.export'))
            ->assertForbidden();
    }

    public function test_export_downloads_excel_with_one_row_per_line(): void
    {
        $this->grantListPermission();
        Excel::fake();

        $tx = $this->makeTransaction(TransactionType::EXPORT, lineCount: 2);

        $this->actingAs($this->user)
            ->get(route('inventory.transactions.export'))
            ->assertOk();

        Excel::assertDownloaded(
            'stock-transactions-'.now()->format('Y-m-d').'.xlsx',
            function (StockTransactionsExport $export) use ($tx): bool {
                $transactions = $export->collection();
                $rows = $export->map($transactions->first());

                return $transactions->count() === 1
                    && $transactions->first()->is($tx)
                    && count($rows) === 2; // one row per transaction line
            },
        );
    }

    public function test_export_honors_transaction_type_filter(): void
    {
        $this->grantListPermission();
        Excel::fake();

        $exportTx = $this->makeTransaction(TransactionType::EXPORT, lineCount: 1);
        $this->makeTransaction(TransactionType::ENTRY, lineCount: 1);

        $this->actingAs($this->user)
            ->get(route('inventory.transactions.export', [
                'filters' => ['transaction_type' => TransactionType::EXPORT->value],
            ]))
            ->assertOk();

        Excel::assertDownloaded(
            'stock-transactions-'.now()->format('Y-m-d').'.xlsx',
            function (StockTransactionsExport $export) use ($exportTx): bool {
                $transactions = $export->collection();

                return $transactions->count() === 1
                    && $transactions->first()->is($exportTx);
            },
        );
    }

    // --- helpers ---------------------------------------------------------

    private function grantListPermission(): void
    {
        Permission::findOrCreate(self::PERMISSION, 'web');
        $this->user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function makeTransaction(TransactionType $type, int $lineCount): StockTransaction
    {
        $tx = StockTransaction::create([
            'transaction_type' => $type->value,
            'reference_number' => $type->referencePrefix().'-'.uniqid(),
            'transaction_date' => now()->toDateString(),
            'store_id' => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status' => TransactionStatus::APPROVED->value,
        ]);

        for ($i = 0; $i < $lineCount; $i++) {
            StockTransactionLine::create([
                'transaction_id' => $tx->id,
                'item_id' => $this->item->id,
                'unit_id' => $this->unit->id,
                'quantity' => 5,
                'quantity_base_units' => 5,
            ]);
        }

        return $tx;
    }
}
