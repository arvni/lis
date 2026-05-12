<?php

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\StatementDTO;
use App\Domains\Billing\DTOs\StatementExportDTO;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Repositories\StatementRepository;
use App\Domains\Reception\Enums\AcceptanceStatus;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class StatementService
{
    public function __construct(
        private readonly StatementRepository $statementRepository,
        private readonly InvoiceService      $invoiceService,

    )
    {
    }

    public function listStatements($queryData): LengthAwarePaginator
    {
        return $this->statementRepository->listStatements($queryData);
    }

    /**
     * Stores a new statement and processes related invoice updates.
     */
    public function storeStatement(StatementDTO $statementDTO): Statement
    {
        $statement = $this->statementRepository->creatStatement($statementDTO->toArray());
        if ($statementDTO->invoices) {
            $this->processInvoiceChange($statement,$statementDTO->invoices);
        }

        return $statement;
    }

    /**
     * Updates an existing statement and processes related invoice updates.
     */
    public function updateStatement(Statement $statement,StatementDTO $statementDTO): Statement
    {
        $statement->loadMissing('invoices');
        $updatedStatement = $this->statementRepository->updateStatement($statement, $statementDTO->toArray());
        $this->processInvoiceChange($statement,$statementDTO->invoices);

        return $updatedStatement;
    }

    /**
     * Finds a statement by its ID.
     */
    public function findStatementById(int $id): ?Statement // Added type hint for $id
    {
        return $this->statementRepository->findStatementById($id);
    }

    /**
     * Deletes a statement and updates the status of its associated invoice.
     */
    public function deleteStatement(Statement $statement): void
    {
        $this->statementRepository->deleteStatement($statement);
    }

    public function prepareExportData(Statement $statement): StatementExportDTO
    {
        $this->loadStatement($statement);

        return new StatementExportDTO(
            invoicesData:  $this->prepareInvoicesData($statement->invoices),
            exportOptions: $this->buildExportOptions($statement),
            filename:      $this->generateFilename($statement),
        );
    }

    private function loadStatement(Statement $statement): void
    {
        $reportDateSubquery = DB::table('acceptance_items')
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('methods', 'methods.id', '=', 'method_tests.method_id')
            ->selectRaw('MAX(DATE_ADD(acceptance_items.created_at, INTERVAL methods.turnaround_time + 2 * FLOOR((methods.turnaround_time + WEEKDAY(acceptance_items.created_at)) / 5) DAY))')
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
            $grossAmount     = $invoice->acceptance_items_sum_price ?? 0;
            $itemDiscounts   = $invoice->acceptance_items_sum_discount ?? 0;
            $invoiceDiscount = $invoice->discount ?? 0;
            $netAmount       = $grossAmount - $itemDiscounts - $invoiceDiscount;

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

    private function processInvoiceChange(Statement $statement, array $invoices): void
    {
        $this->invoiceService->updateInvoicesStatementID($statement, $invoices);
    }
}
