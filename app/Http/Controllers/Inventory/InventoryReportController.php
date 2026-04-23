<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Exports\CurrentStockExport;
use App\Domains\Inventory\Exports\ExpiryReportExport;
use App\Domains\Inventory\Exports\TransactionHistoryExport;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\Store;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class InventoryReportController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', StockTransaction::class);

        return Inertia::render('Inventory/Reports/Index', [
            'stores' => Store::active()->get(['id', 'name']),
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $this->authorize('viewAny', StockTransaction::class);

        $type    = $request->input('type');
        $storeId = $request->integer('store_id') ?: null;

        return match ($type) {
            'current_stock' => Excel::download(
                new CurrentStockExport($storeId),
                'current-stock-' . now()->format('Y-m-d') . '.xlsx'
            ),
            'transaction_history' => Excel::download(
                new TransactionHistoryExport(
                    $storeId,
                    $request->input('date_from'),
                    $request->input('date_to'),
                    $request->input('transaction_type') ?: null,
                ),
                'transaction-history-' . now()->format('Y-m-d') . '.xlsx'
            ),
            'expiry' => Excel::download(
                new ExpiryReportExport($storeId, $request->integer('days', 90)),
                'expiry-report-' . now()->format('Y-m-d') . '.xlsx'
            ),
            default => abort(400, 'Unknown report type'),
        };
    }
}
