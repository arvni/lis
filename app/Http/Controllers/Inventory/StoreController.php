<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Services\StoreService;
use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function __construct(private StoreService $storeService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Store::class);
        $requestInputs = $request->all();
        $stores = $this->storeService->listStores($requestInputs);
        return Inertia::render('Inventory/Stores/Index', compact('stores', 'requestInputs'));
    }

    public function create(): Response
    {
        $this->authorize('create', Store::class);
        return Inertia::render('Inventory/Stores/Add', [
            'managers' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Store::class);
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'code'            => 'required|string|max:50|unique:stores,code',
            'description'     => 'nullable|string',
            'manager_user_id' => 'nullable|exists:users,id',
            'address'         => 'nullable|string',
            'notes'           => 'nullable|string',
        ]);

        $store = $this->storeService->createStore($data);
        return redirect()->route('inventory.stores.show', $store->id)
            ->with(['success' => true, 'status' => "Store {$store->name} created."]);
    }

    public function show(Store $store): Response
    {
        $this->authorize('view', Store::class);
        $store->load(['manager', 'locations']);
        return Inertia::render('Inventory/Stores/Show', compact('store'));
    }

    public function edit(Store $store): Response
    {
        $this->authorize('update', Store::class);
        return Inertia::render('Inventory/Stores/Edit', [
            'store'    => $store,
            'managers' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Store $store): RedirectResponse
    {
        $this->authorize('update', Store::class);
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'code'            => "required|string|max:50|unique:stores,code,{$store->id}",
            'description'     => 'nullable|string',
            'is_active'       => 'boolean',
            'manager_user_id' => 'nullable|exists:users,id',
            'address'         => 'nullable|string',
            'notes'           => 'nullable|string',
        ]);

        $this->storeService->updateStore($store, $data);
        return back()->with(['success' => true, 'status' => "Store updated."]);
    }

    public function destroy(Store $store): RedirectResponse
    {
        $this->authorize('delete', Store::class);
        $name = $store->name;
        $this->storeService->deleteStore($store);
        return redirect()->route('inventory.stores.index')
            ->with(['success' => true, 'status' => "{$name} deleted."]);
    }
}
