<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\Supplier;
use App\Domains\Inventory\Requests\StoreStockTransactionRequest;
use App\Domains\Inventory\Requests\UpdateStockTransactionRequest;
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
            $defaults = $this->transactionService->findForRepeat($repeatFrom);
        }

        return Inertia::render('Inventory/Transactions/Add', [
            'transactionTypes' => TransactionType::toOptions(),
            'stores'           => Store::active()->get(['id', 'name']),
            'defaultType'      => $defaults->transaction_type ?? $request->input('type', TransactionType::ENTRY->value),
            'defaults'         => $defaults,
        ]);
    }

    public function store(StoreStockTransactionRequest $request): RedirectResponse
    {
        $this->authorize('create', StockTransaction::class);
        $tx = $this->transactionService->createTransaction($request->validated());
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
            'transactionTypes' => TransactionType::toOptions(),
            'stores'           => Store::active()->get(['id', 'name']),
        ]);
    }

    public function update(UpdateStockTransactionRequest $request, StockTransaction $transaction): RedirectResponse
    {
        $this->authorize('create', StockTransaction::class);

        if (!$transaction->isDraft())
            abort(403, "Only DRAFT transactions can be edited.");

        $this->transactionService->updateTransaction($transaction, $request->validated());

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
