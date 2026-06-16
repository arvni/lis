<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\ItemCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItemCodeServiceTest extends TestCase
{
    use RefreshDatabase;

    private ItemCodeService $service;
    private Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ItemCodeService();
        $this->unit = Unit::create(['name' => 'Box', 'abbreviation' => 'box']);
    }

    public function test_generates_first_code_with_padding(): void
    {
        $this->assertSame('LAB-CHM-000001', $this->service->generate('LAB', 'CHM'));
    }

    public function test_increments_from_last_existing_code(): void
    {
        $this->makeItem('LAB-CHM-000007');
        $this->assertSame('LAB-CHM-000008', $this->service->generate('LAB', 'CHM'));
    }

    public function test_sequences_are_isolated_per_prefix(): void
    {
        $this->makeItem('LAB-CHM-000005');
        $this->assertSame('LAB-RGT-000001', $this->service->generate('LAB', 'RGT'));
    }

    private function makeItem(string $code): Item
    {
        return Item::create([
            'item_code'         => $code,
            'name'              => 'Item ' . $code,
            'department'        => 'LAB',
            'material_type'     => 'CHM',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id'   => $this->unit->id,
            'is_active'         => true,
        ]);
    }
}
