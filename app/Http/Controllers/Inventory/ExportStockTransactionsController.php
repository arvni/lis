<?php

declare(strict_types=1);

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Exports\StockTransactionsExport;
use App\Domains\Inventory\Requests\ExportStockTransactionsRequest;
use App\Domains\Inventory\Services\StockTransactionService;
use App\Http\Controllers\Controller;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportStockTransactionsController extends Controller
{
    public function __construct(private readonly StockTransactionService $transactionService)
    {
        $this->middleware('indexProvider');
    }

    public function __invoke(ExportStockTransactionsRequest $request): BinaryFileResponse
    {
        $transactions = $this->transactionService->listAllTransactions($request->all());

        return Excel::download(
            new StockTransactionsExport($transactions),
            'stock-transactions-'.now()->format('Y-m-d').'.xlsx',
        );
    }
}
