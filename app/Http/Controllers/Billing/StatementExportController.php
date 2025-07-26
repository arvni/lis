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
    /**
     * Export statement as Excel file
     */
    public function __invoke(Statement $statement): BinaryFileResponse
    {
//        try {
            // Load statement with optimized relationships

        $statement->load([
            'referrer',
            'invoices' => function ($query) {
                $reportDateSubquery = DB::table('acceptance_items')
                    ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
                    ->join('methods', 'methods.id', '=', 'method_tests.method_id')
                    ->selectRaw('MAX(DATE_ADD(acceptance_items.created_at, INTERVAL methods.turnaround_time DAY))')
                    ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id');
                $query->with([
                    "acceptance" => function ($query) use ($reportDateSubquery) {
                        $query->with("patient")->addSelect(['report_date' => $reportDateSubquery]);
                    },
                    "acceptanceItems.test",
                    "acceptanceItems.report:id,published_at,acceptance_item_id",
                ])
                    ->withSum("payments", "price")
                    ->withSum("acceptanceItems", "discount")
                    ->withSum("acceptanceItems", "price");
                $query->addSelect(
                    DB::raw('CONCAT(
                    DATE_FORMAT(created_at, "%Y-%m"),
                    "/",
                    (SELECT COUNT(*)
                     FROM invoices i2
                     WHERE i2.id <= invoices.id
                     AND YEAR(i2.created_at) = YEAR(invoices.created_at)
                    )
                ) AS invoice_no')
                );
            }
        ]);
            // Prepare export data
            $invoicesData = $this->prepareInvoicesData($statement->invoices);
            $exportOptions = $this->buildExportOptions($statement);
            // Create and download export
            $export = MonthlyStatementExport::createFromArray($invoicesData, $exportOptions);
            $filename = $this->generateFilename($statement);

            Log::info('Statement exported successfully', [
                'statement_id' => $statement->id,
                'statement_no' => $statement->no,
                'invoices_count' => count($statement->invoices),
                'filename' => $filename
            ]);

            return Excel::download($export, $filename);

//        } catch (\Exception $e) {
//            Log::error('Failed to export statement', [
//                'statement_id' => $statement->id,
//                'error' => $e->getMessage(),
//                'trace' => $e->getTraceAsString()
//            ]);
//
//            abort(Response::HTTP_INTERNAL_SERVER_ERROR, 'Failed to generate export file');
//        }
    }

    /**
     * Load statement with optimized eager loading
     */
    private function loadStatementWithRelations(Statement $statement): Statement
    {
        // Create report date subquery once for reuse
        $reportDateSubquery = $this->getReportDateSubquery();

        return $statement->load([
            'referrer:referrers.id,referrers.fullName',
            'invoices' => function ($query) use ($reportDateSubquery) {
                $query->addSelect(
                    DB::raw('CONCAT(
                        DATE_FORMAT(created_at, "%Y-%m"),
                        "/",
                        (SELECT COUNT(*)
                         FROM invoices i2
                         WHERE i2.id <= invoices.id
                         AND YEAR(i2.created_at) = YEAR(invoices.created_at)
                        )
                    ) AS invoice_no')
                )
                    ->with([
                        'acceptance' => function ($query) use ($reportDateSubquery) {
                            $query->addSelect(['report_date' => $reportDateSubquery])
                                ->with('patient:id,fullName');
                        },
                        'acceptanceItems' => function ($query) {
                            $query->with([
                                    'test:tests.id,tests.code,tests.fullName',
                                    'report:reports.id,reports.published_at,reports.acceptance_item_id'
                                ]);
                        }
                    ])
                    ->withSum('payments', 'price')
                    ->withSum('acceptanceItems', 'discount')
                    ->withSum('acceptanceItems', 'price');
            }
        ]);
    }

    /**
     * Get report date subquery
     */
    private function getReportDateSubquery()
    {
        return DB::table('acceptance_items')
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('methods', 'methods.id', '=', 'method_tests.method_id')
            ->selectRaw('MAX(DATE_ADD(acceptance_items.created_at, INTERVAL methods.turnaround_time DAY))')
            ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id');
    }

    /**
     * Prepare export options/metadata
     */
    private function buildExportOptions(Statement $statement): array
    {
        return [
            'customer_name' => $statement->referrer->fullName,
            'statement_number' => $statement->no,
            'statement_date' => Carbon::parse($statement->issue_date)->format('M d, Y'),
            'total_samples' => $statement->invoices->count(),
            'total_amount' => $this->calculateTotalAmount($statement->invoices),
            'generated_at' => now()->format('M d, Y H:i'),
        ];
    }

    /**
     * Calculate total amount for all invoices
     */
    private function calculateTotalAmount(Collection $invoices): float
    {
        return $invoices->sum(function ($invoice) {
            return ($invoice->acceptance_items_sum_price ?? 0)
                - ($invoice->acceptance_items_sum_discount ?? 0)
                - ($invoice->discount ?? 0);
        });
    }

    /**
     * Prepare invoices data for export
     */
    private function prepareInvoicesData(Collection $invoices): array
    {
        return $invoices->map(function ($invoice) {
            // Calculate net amount
            $grossAmount = $invoice->acceptance_items_sum_price ?? 0;
            $itemDiscounts = $invoice->acceptance_items_sum_discount ?? 0;
            $invoiceDiscount = $invoice->discount ?? 0;
            $netAmount = $grossAmount - $itemDiscounts - $invoiceDiscount;

            // Get test information
            $testCodes = $this->getTestCodes($invoice->acceptanceItems);
            $testNames = $this->getTestNames($invoice->acceptanceItems);

            // Get reported date
            $reportedAt = $this->getReportedDate($invoice);

            return [
                'invoice_no' => $invoice->invoice_no,
                'acceptance_date' => $this->formatDate($invoice->acceptance->created_at),
                'patient_name' => $invoice->acceptance->patient->fullName ?? 'N/A',
                'test_codes' => $testCodes,
                'test_names' => $testNames,
                'gross_amount' => $grossAmount,
                'item_discounts' => $itemDiscounts,
                'invoice_discount' => $invoiceDiscount,
                'net_amount' => $netAmount,
                'reported_at' => $reportedAt,
                'payment_received' => $invoice->payments_sum_price ?? 0,
                'balance' => $netAmount - ($invoice->payments_sum_price ?? 0),
            ];
        })->toArray();
    }

    /**
     * Get unique test codes from acceptance items
     */
    private function getTestCodes(Collection $acceptanceItems): string
    {
        return $acceptanceItems
            ->pluck('test.code')
            ->filter()
            ->unique()
            ->sort()
            ->join(', ') ?: 'N/A';
    }

    /**
     * Get unique test names from acceptance items
     */
    private function getTestNames(Collection $acceptanceItems): string
    {
        return $acceptanceItems
            ->pluck('test.fullName')
            ->filter()
            ->unique()
            ->sort()
            ->join(', ') ?: 'N/A';
    }

    /**
     * Get the reported date based on acceptance status
     */
    private function getReportedDate($invoice): string
    {
        $acceptance = $invoice->acceptance;

        if ($acceptance->status === AcceptanceStatus::REPORTED) {
            // Get the latest published report date
            $latestPublishedAt = $invoice->acceptanceItems
                ->pluck('report.published_at')
                ->filter()
                ->max();

            return $latestPublishedAt
                ? $this->formatDate($latestPublishedAt)
                : $this->formatDate($acceptance->updated_at);
        }

        // For non-reported acceptances, use expected report date
        return $acceptance->report_date
            ? $this->formatDate($acceptance->report_date)
            : 'Pending';
    }

    /**
     * Format date consistently
     */
    private function formatDate($date): string
    {
        if (!$date) {
            return 'N/A';
        }

//        try {
            return Carbon::parse($date)->format('M d, Y');
//        } catch (\Exception $e) {
//            Log::warning('Failed to parse date', ['date' => $date, 'error' => $e->getMessage()]);
//            return 'Invalid Date';
//        }
    }

    /**
     * Generate filename for export
     */
    private function generateFilename(Statement $statement): string
    {
        $referrerName = str_replace([' ', '/'], '_', $statement->referrer->fullName);
        $statementNo = str_replace(['/', ' '], '_', $statement->no);
        $timestamp = now()->format('Y_m_d_His');

        return "statement_{$referrerName}_{$statementNo}_{$timestamp}.xlsx";
    }
}
