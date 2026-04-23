<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\Supplier;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockTransactionController extends Controller
{
    public function __construct(private StockTransactionService $transactionService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', StockTransaction::class);
        $requestInputs = $request->all();
        $transactions = $this->transactionService->listTransactions($requestInputs);
        $stores = Store::active()->get(['id', 'name']);
        return Inertia::render('Inventory/Transactions/Index', compact('transactions', 'requestInputs', 'stores'));
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', StockTransaction::class);

        $defaults = null;
        if ($repeatFrom = $request->integer('repeat_from')) {
            $source = StockTransaction::with(['lines.item.defaultUnit', 'lines.unit', 'supplier'])->find($repeatFrom);
            if ($source) $defaults = $source;
        }

        return Inertia::render('Inventory/Transactions/Add', [
            'transactionTypes' => enumMap(TransactionType::cases()),
            'stores'           => Store::active()->get(['id', 'name']),
            'defaultType'      => $defaults?->transaction_type ?? $request->input('type', TransactionType::ENTRY->value),
            'defaults'         => $defaults,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', StockTransaction::class);
        $data = $request->validate([
            'transaction_type'     => 'required|string',
            'transaction_date'     => 'required|date',
            'store_id'             => 'required|exists:stores,id',
            'destination_store_id' => 'nullable|exists:stores,id',
            'supplier_id'          => 'nullable|exists:suppliers,id',
            'notes'                => 'nullable|string',
            'lines'                => 'required|array|min:1',
            'lines.*.item_id'      => 'required|exists:items,id',
            'lines.*.unit_id'      => 'required|exists:units,id',
            'lines.*.quantity'     => 'required|numeric|min:0.000001',
            'lines.*.lot_number'   => 'nullable|string',
            'lines.*.brand'        => 'nullable|string',
            'lines.*.cat_no'       => 'nullable|string',
            'lines.*.barcode'      => 'nullable|string',
            'lines.*.expiry_date'  => 'nullable|date',
            'lines.*.unit_price'   => 'nullable|numeric|min:0',
            'lines.*.store_location_id' => 'nullable|exists:store_locations,id',
            'lines.*.notes'        => 'nullable|string',
        ]);

        $tx = $this->transactionService->createTransaction($data);
        return redirect()->route('inventory.transactions.show', $tx->id)
            ->with(['success' => true, 'status' => "Transaction {$tx->reference_number} created."]);
    }

    public function edit(StockTransaction $transaction): Response
    {
        $this->authorize('create', StockTransaction::class);

        if (!$transaction->isDraft())
            abort(403, "Only DRAFT transactions can be edited.");

        $transaction->load(['lines.item.defaultUnit', 'lines.item.unitConversions.unit', 'lines.unit', 'lines.location', 'supplier']);

        return Inertia::render('Inventory/Transactions/Edit', [
            'transaction'      => $transaction,
            'transactionTypes' => enumMap(TransactionType::cases()),
            'stores'           => Store::active()->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, StockTransaction $transaction): RedirectResponse
    {
        $this->authorize('create', StockTransaction::class);

        if (!$transaction->isDraft())
            abort(403, "Only DRAFT transactions can be edited.");

        $data = $request->validate([
            'transaction_date'     => 'required|date',
            'store_id'             => 'required|exists:stores,id',
            'destination_store_id' => 'nullable|exists:stores,id',
            'supplier_id'          => 'nullable|exists:suppliers,id',
            'notes'                => 'nullable|string',
            'lines'                => 'required|array|min:1',
            'lines.*.item_id'      => 'required|exists:items,id',
            'lines.*.unit_id'      => 'required|exists:units,id',
            'lines.*.quantity'     => 'required|numeric|min:0.000001',
            'lines.*.lot_number'   => 'nullable|string',
            'lines.*.brand'        => 'nullable|string',
            'lines.*.cat_no'       => 'nullable|string',
            'lines.*.barcode'      => 'nullable|string',
            'lines.*.expiry_date'  => 'nullable|date',
            'lines.*.unit_price'   => 'nullable|numeric|min:0',
            'lines.*.store_location_id' => 'nullable|exists:store_locations,id',
            'lines.*.notes'        => 'nullable|string',
        ]);

        $this->transactionService->updateTransaction($transaction, $data);

        return redirect()->route('inventory.transactions.show', $transaction->id)
            ->with(['success' => true, 'status' => "Transaction {$transaction->reference_number} updated."]);
    }

    public function show(StockTransaction $transaction): Response
    {
        $this->authorize('view', StockTransaction::class);
        $transaction = $this->transactionService->getTransactionById($transaction->id);
        return Inertia::render('Inventory/Transactions/Show', compact('transaction'));
    }
}
