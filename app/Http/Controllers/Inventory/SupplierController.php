<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\SupplierType;
use App\Domains\Inventory\Models\Supplier;
use App\Domains\Inventory\Requests\StoreSupplierRequest;
use App\Domains\Inventory\Requests\UpdateSupplierRequest;
use App\Domains\Inventory\Services\SupplierService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function __construct(private SupplierService $supplierService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Supplier::class);
        $requestInputs = $request->all();
        $suppliers = $this->supplierService->listSuppliers($requestInputs);
        return Inertia::render('Inventory/Suppliers/Index', compact('suppliers', 'requestInputs'));
    }

    public function create(): Response
    {
        $this->authorize('create', Supplier::class);
        return Inertia::render('Inventory/Suppliers/Add', [
            'types' => SupplierType::toOptions(),
        ]);
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        $this->authorize('create', Supplier::class);
        $supplier = $this->supplierService->createSupplier($request->validated());
        return redirect()->route('inventory.suppliers.show', $supplier->id)
            ->with(['success' => true, 'status' => "Supplier {$supplier->name} created."]);
    }

    public function show(Supplier $supplier): Response
    {
        $this->authorize('view', Supplier::class);
        $supplier->load(['contacts', 'supplierItems.item.defaultUnit']);
        return Inertia::render('Inventory/Suppliers/Show', compact('supplier'));
    }

    public function edit(Supplier $supplier): Response
    {
        $this->authorize('update', Supplier::class);
        $supplier->load('contacts');
        return Inertia::render('Inventory/Suppliers/Edit', [
            'supplier' => $supplier,
            'types'    => SupplierType::toOptions(),
        ]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $this->authorize('update', Supplier::class);
        $this->supplierService->updateSupplier($supplier, $request->validated());
        return back()->with(['success' => true, 'status' => "Supplier updated."]);
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $this->authorize('delete', Supplier::class);
        $name = $supplier->name;
        $this->supplierService->deleteSupplier($supplier);
        return redirect()->route('inventory.suppliers.index')
            ->with(['success' => true, 'status' => "{$name} deleted."]);
    }
}
