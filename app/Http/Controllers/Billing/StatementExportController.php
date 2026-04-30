<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Exports\MonthlyStatementExport;
use App\Domains\Billing\Models\Statement;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StatementExportController extends Controller
{
    public function __invoke(Statement $statement): BinaryFileResponse
    {
        try {
            $this->loadStatement($statement);

            $invoicesData  = $this->prepareInvoicesData($statement->invoices);
            $exportOptions = $this->buildExportOptions($statement);
            $export        = MonthlyStatementExport::createFromArray($invoicesData, $exportOptions);
            $filename      = $this->generateFilename($statement);

            Log::info('Statement exported successfully', [
                'statement_id'   => $statement->id,
                'statement_no'   => $statement->no,
                'invoices_count' => $statement->invoices->count(),
                'filename'       => $filename,
            ]);

            return Excel::download($export, $filename);
        } catch (\Exception $e) {
            Log::error('Failed to export statement', [
                'statement_id' => $statement->id,
                'error'        => $e->getMessage(),
                'trace'        => $e->getTraceAsString(),
            ]);
            abort(500, 'Failed to generate export file');
        }
    }

    private function loadStatement(Statement $statement): void
    {
        $reportDateSubquery = DB::table('acceptance_items')
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('methods', 'methods.id', '=', 'method_tests.method_id')
            ->selectRaw('MAX(DATE_ADD(acceptance_items.created_at, INTERVAL methods.turnaround_time DAY))')
            ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id');

        $statement->load([
            'referrer',
            'invoices' => function ($query) use ($reportDateSubquery) {
                $query->with([
                    'acceptance' => fn($q) => $q->with('patient')->addSelect(['report_date' => $reportDateSubquery]),
                    'acceptanceItems.test',
                    'acceptanceItems.report:id,published_at,acceptance_item_id',
                ])
                    ->withSum('payments', 'price')
                    ->withSum('acceptanceItems', 'discount')
                    ->withSum('acceptanceItems', 'price')
                    ->addSelect(DB::raw('CONCAT(
                        DATE_FORMAT(created_at, "%Y-%m"),
                        "/",
                        (SELECT COUNT(*) FROM invoices i2
                         WHERE i2.id <= invoices.id
                         AND YEAR(i2.created_at) = YEAR(invoices.created_at))
                    ) AS invoice_no'));
            },
        ]);
    }

    private function buildExportOptions(Statement $statement): array
    {
        return [
            'customer_name'    => $statement->referrer->fullName,
            'statement_number' => $statement->no,
            'statement_date'   => Carbon::parse($statement->issue_date)->format('M d, Y'),
            'total_samples'    => $statement->invoices->count(),
            'total_amount'     => $this->calculateTotalAmount($statement->invoices),
            'generated_at'     => $statement->updated_at?->format('M d, Y H:i'),
        ];
    }

    private function calculateTotalAmount(Collection $invoices): float
    {
        return $invoices->sum(fn($invoice) =>
            ($invoice->acceptance_items_sum_price ?? 0)
            - ($invoice->acceptance_items_sum_discount ?? 0)
            - ($invoice->discount ?? 0)
        );
    }

    private function prepareInvoicesData(Collection $invoices): array
    {
        return $invoices->map(function ($invoice) {
            $grossAmount    = $invoice->acceptance_items_sum_price ?? 0;
            $itemDiscounts  = $invoice->acceptance_items_sum_discount ?? 0;
            $invoiceDiscount = $invoice->discount ?? 0;
            $netAmount      = $grossAmount - $itemDiscounts - $invoiceDiscount;

            return [
                'invoice_no'       => $invoice->invoice_no,
                'acceptance_date'  => $this->formatDate($invoice->acceptance->created_at),
                'patient_name'     => $invoice->acceptance->patient->fullName ?? 'N/A',
                'test_codes'       => $this->getTestCodes($invoice->acceptanceItems),
                'test_names'       => $this->getTestNames($invoice->acceptanceItems),
                'gross_amount'     => $grossAmount,
                'item_discounts'   => $itemDiscounts,
                'invoice_discount' => $invoiceDiscount,
                'net_amount'       => $netAmount,
                'reported_at'      => $this->getReportedDate($invoice),
                'payment_received' => $invoice->payments_sum_price ?? 0,
                'balance'          => $netAmount - ($invoice->payments_sum_price ?? 0),
            ];
        })->toArray();
    }

    private function getTestCodes(Collection $acceptanceItems): string
    {
        return $acceptanceItems->pluck('test.code')->filter()->unique()->sort()->join(', ') ?: 'N/A';
    }

    private function getTestNames(Collection $acceptanceItems): string
    {
        return $acceptanceItems->pluck('test.fullName')->filter()->unique()->sort()->join(', ') ?: 'N/A';
    }

    private function getReportedDate($invoice): string
    {
        $acceptance = $invoice->acceptance;

        if ($acceptance->status === AcceptanceStatus::REPORTED) {
            $latestPublishedAt = $invoice->acceptanceItems->pluck('report.published_at')->filter()->max();
            return $latestPublishedAt
                ? $this->formatDate($latestPublishedAt)
                : $this->formatDate($acceptance->updated_at);
        }

        return $acceptance->report_date ? $this->formatDate($acceptance->report_date) : 'Pending';
    }

    private function formatDate($date): string
    {
        return $date ? Carbon::parse($date)->format('M d, Y') : 'N/A';
    }

    private function generateFilename(Statement $statement): string
    {
        $referrerName = str_replace([' ', '/'], '_', $statement->referrer->fullName);
        $statementNo  = str_replace(['/', ' '], '_', $statement->no);
        return 'statement_' . $referrerName . '_' . $statementNo . '_' . now()->format('Y_m_d_His') . '.xlsx';
    }
}
