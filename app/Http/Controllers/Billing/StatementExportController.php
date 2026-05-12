<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Exports\MonthlyStatementExport;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Services\StatementService;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StatementExportController extends Controller
{
    public function __construct(private StatementService $statementService) {}

    public function __invoke(Statement $statement): BinaryFileResponse
    {
        try {
            $data   = $this->statementService->prepareExportData($statement);
            $export = MonthlyStatementExport::createFromArray($data->invoicesData, $data->exportOptions);

            Log::info('Statement exported successfully', [
                'statement_id'   => $statement->id,
                'statement_no'   => $statement->no,
                'invoices_count' => count($data->invoicesData),
                'filename'       => $data->filename,
            ]);

            return Excel::download($export, $data->filename);
        } catch (\Exception $e) {
            Log::error('Failed to export statement', [
                'statement_id' => $statement->id,
                'error'        => $e->getMessage(),
                'trace'        => $e->getTraceAsString(),
            ]);
            abort(500, 'Failed to generate export file');
        }
    }
}
