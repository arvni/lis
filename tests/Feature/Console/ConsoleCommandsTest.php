<?php

namespace Tests\Feature\Console;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\StockLot;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\Unit;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ConsoleCommandsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    // ── inventory:mark-expired-lots ──────────────────────────────────────────────

    public function test_mark_expired_lots_command_expires_past_dated_active_lots(): void
    {
        $unit = Unit::create(['name' => 'u', 'abbreviation' => 'u']);
        $store = Store::create(['name' => 'S', 'code' => 'S', 'is_active' => true]);
        $item = Item::create([
            'item_code' => 'I-EXP-1', 'name' => 'R', 'department' => 'LAB',
            'material_type' => 'RGT', 'storage_condition' => 'ROOM_TEMP',
            'default_unit_id' => $unit->id, 'is_active' => true,
        ]);

        $expired = StockLot::create([
            'item_id' => $item->id, 'store_id' => $store->id, 'status' => 'ACTIVE',
            'quantity_base_units' => 5, 'lot_number' => 'OLD',
            'received_date' => now()->subDays(60)->toDateString(),
            'expiry_date'   => now()->subDay()->toDateString(),
        ]);
        $fresh = StockLot::create([
            'item_id' => $item->id, 'store_id' => $store->id, 'status' => 'ACTIVE',
            'quantity_base_units' => 5, 'lot_number' => 'NEW',
            'received_date' => now()->toDateString(),
            'expiry_date'   => now()->addYear()->toDateString(),
        ]);

        $this->artisan('inventory:mark-expired-lots')->assertExitCode(0);

        $this->assertDatabaseHas('stock_lots', ['id' => $expired->id, 'status' => 'EXPIRED']);
        $this->assertDatabaseHas('stock_lots', ['id' => $fresh->id, 'status' => 'ACTIVE']);
    }

    // ── acceptance:check ─────────────────────────────────────────────────────────

    public function test_acceptance_check_command_runs_with_no_data(): void
    {
        $this->artisan('acceptance:check')->assertExitCode(0);
    }

    // ── inventory:escalate-overdue-pr-steps ──────────────────────────────────────

    public function test_escalate_overdue_pr_steps_command_runs_with_no_overdue(): void
    {
        // The command resolves the "Store Manager" role; it must exist.
        Role::create(['name' => 'Store Manager', 'guard_name' => 'web']);

        $this->artisan('inventory:escalate-overdue-pr-steps')
            ->expectsOutputToContain('overdue step(s) processed')
            ->assertExitCode(0);
    }
}
