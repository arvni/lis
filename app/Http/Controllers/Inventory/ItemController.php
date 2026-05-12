<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\ItemDepartment;
use App\Domains\Inventory\Enums\ItemMaterialType;
use App\Domains\Inventory\Enums\StorageCondition;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Requests\StoreItemRequest;
use App\Domains\Inventory\Requests\UpdateItemRequest;
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
            'departments'       => ItemDepartment::toOptions(),
            'materialTypes'     => ItemMaterialType::toOptions(),
            'storageConditions' => StorageCondition::toOptions(),
            'units'             => Unit::orderBy('name')->get(['id', 'name', 'abbreviation']),
        ]);
    }

    public function store(StoreItemRequest $request): RedirectResponse
    {
        $this->authorize('create', Item::class);
        $item = $this->itemService->createItem($request->validated());
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
            'departments'       => ItemDepartment::toOptions(),
            'materialTypes'     => ItemMaterialType::toOptions(),
            'storageConditions' => StorageCondition::toOptions(),
            'units'             => Unit::orderBy('name')->get(['id', 'name', 'abbreviation']),
        ]);
    }

    public function update(UpdateItemRequest $request, Item $item): RedirectResponse
    {
        $this->authorize('update', Item::class);
        $this->itemService->updateItem($item, $request->validated());
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
