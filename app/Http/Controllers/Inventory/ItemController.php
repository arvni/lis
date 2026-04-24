<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\ItemDepartment;
use App\Domains\Inventory\Enums\ItemMaterialType;
use App\Domains\Inventory\Enums\StorageCondition;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\ItemService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function __construct(private ItemService $itemService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Item::class);
        $requestInputs = $request->all();
        $items = $this->itemService->listItems($requestInputs);
        return Inertia::render('Inventory/Items/Index', compact('items', 'requestInputs'));
    }

    public function create(): Response
    {
        $this->authorize('create', Item::class);
        return Inertia::render('Inventory/Items/Add', [
            'departments'       => enumMap(ItemDepartment::cases()),
            'materialTypes'     => enumMap(ItemMaterialType::cases()),
            'storageConditions' => enumMap(StorageCondition::cases()),
            'units'             => Unit::orderBy('name')->get(['id', 'name', 'abbreviation']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Item::class);
        $data = $request->validate([
            'name'                   => 'required|string|max:255',
            'scientific_name'        => 'nullable|string|max:255',
            'department'             => 'required|string',
            'material_type'          => 'required|string',
            'description'            => 'nullable|string',
            'storage_condition'      => 'required|string',
            'storage_condition_notes'=> 'nullable|string',
            'default_unit_id'        => 'required|exists:units,id',
            'is_hazardous'           => 'boolean',
            'requires_lot_tracking'  => 'boolean',
            'minimum_stock_level'    => 'numeric|min:0',
            'maximum_stock_level'    => 'nullable|numeric|min:0',
            'lead_time_days'         => 'nullable|integer|min:0',
            'notes'                  => 'nullable|string',
            'unit_conversions'       => 'nullable|array',
            'unit_conversions.*.unit_id'          => 'required|exists:units,id',
            'unit_conversions.*.conversion_to_base' => 'required|numeric|min:0.000001',
        ]);

        $item = $this->itemService->createItem($data);
        return redirect()->route('inventory.items.show', $item->id)
            ->with(['success' => true, 'status' => "Item {$item->item_code} created successfully."]);
    }

    public function show(Item $item): Response
    {
        $this->authorize('view', Item::class);
        $item->load(['defaultUnit', 'unitConversions.unit', 'supplierItems.supplier']);
        return Inertia::render('Inventory/Items/Show', compact('item'));
    }

    public function edit(Item $item): Response
    {
        $this->authorize('update', Item::class);
        $item->load(['unitConversions.unit']);
        return Inertia::render('Inventory/Items/Edit', [
            'item'              => $item,
            'departments'       => enumMap(ItemDepartment::cases()),
            'materialTypes'     => enumMap(ItemMaterialType::cases()),
            'storageConditions' => enumMap(StorageCondition::cases()),
            'units'             => Unit::orderBy('name')->get(['id', 'name', 'abbreviation']),
        ]);
    }

    public function update(Request $request, Item $item): RedirectResponse
    {
        $this->authorize('update', Item::class);
        $data = $request->validate([
            'name'                   => 'required|string|max:255',
            'scientific_name'        => 'nullable|string|max:255',
            'description'            => 'nullable|string',
            'storage_condition'      => 'required|string',
            'storage_condition_notes'=> 'nullable|string',
            'default_unit_id'        => 'required|exists:units,id',
            'is_active'              => 'boolean',
            'is_hazardous'           => 'boolean',
            'requires_lot_tracking'  => 'boolean',
            'minimum_stock_level'    => 'numeric|min:0',
            'maximum_stock_level'    => 'nullable|numeric|min:0',
            'lead_time_days'         => 'nullable|integer|min:0',
            'notes'                  => 'nullable|string',
            'unit_conversions'       => 'nullable|array',
            'unit_conversions.*.unit_id'          => 'required|exists:units,id',
            'unit_conversions.*.conversion_to_base' => 'required|numeric|min:0.000001',
        ]);

        $this->itemService->updateItem($item, $data);
        return redirect()->route('inventory.items.show', $item->id)
            ->with(['success' => true, 'status' => "Item updated successfully."]);
    }

    public function destroy(Item $item): RedirectResponse
    {
        $this->authorize('delete', Item::class);
        $code = $item->item_code;
        $this->itemService->deleteItem($item);
        return redirect()->route('inventory.items.index')
            ->with(['success' => true, 'status' => "Item {$code} deleted."]);
    }
}
