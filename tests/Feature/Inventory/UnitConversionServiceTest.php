<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\ItemUnitConversion;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\UnitConversionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class UnitConversionServiceTest extends TestCase
{
    use RefreshDatabase;

    private UnitConversionService $service;
    private Unit $vial;   // base unit
    private Unit $box;    // 10 vials
    private Unit $carton; // 100 vials
    private Item $item;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new UnitConversionService();

        $this->vial   = Unit::create(['name' => 'vial', 'abbreviation' => 'v']);
        $this->box    = Unit::create(['name' => 'Box', 'abbreviation' => 'bx']);
        $this->carton = Unit::create(['name' => 'Carton', 'abbreviation' => 'ct']);

        $this->item = Item::create([
            'item_code'         => 'I-UC-1',
            'name'              => 'Reagent',
            'department'        => 'LAB',
            'material_type'     => 'RGT',
            'storage_condition' => 'ROOM_TEMP',
            'default_unit_id'   => $this->vial->id,
            'is_active'         => true,
        ]);

        ItemUnitConversion::create(['item_id' => $this->item->id, 'unit_id' => $this->box->id, 'conversion_to_base' => 10]);
        ItemUnitConversion::create(['item_id' => $this->item->id, 'unit_id' => $this->carton->id, 'conversion_to_base' => 100]);
    }

    public function test_to_base_units_passes_through_default_unit(): void
    {
        $this->assertSame(5.0, $this->service->toBaseUnits($this->item->id, $this->vial->id, 5));
    }

    public function test_to_base_units_multiplies_by_conversion(): void
    {
        $this->assertSame(30.0, $this->service->toBaseUnits($this->item->id, $this->box->id, 3));
    }

    public function test_to_base_units_throws_for_unknown_unit(): void
    {
        $orphan = Unit::create(['name' => 'drum', 'abbreviation' => 'd']);
        $this->expectException(InvalidArgumentException::class);
        $this->service->toBaseUnits($this->item->id, $orphan->id, 1);
    }

    public function test_from_base_units_breaks_into_largest_units(): void
    {
        // 128 vials = 1 carton (100) + 2 boxes (20) + 8 vials
        $breakdown = $this->service->fromBaseUnits($this->item->id, 128);

        $this->assertSame('Carton', $breakdown[0]['unit']->name);
        $this->assertSame(1, $breakdown[0]['qty']);
        $this->assertSame('Box', $breakdown[1]['unit']->name);
        $this->assertSame(2, $breakdown[1]['qty']);
        $this->assertSame('vial', $breakdown[2]['unit']->name);
        $this->assertSame(8.0, $breakdown[2]['qty']);
    }

    public function test_format_stock_renders_human_readable_string(): void
    {
        $this->assertSame('1 Carton, 2 Box, 8 vial', $this->service->formatStock($this->item->id, 128));
    }

    public function test_format_stock_zero_when_empty(): void
    {
        $this->assertSame('0', $this->service->formatStock($this->item->id, 0));
    }
}
