<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Models\Statement;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ShowStatementController extends Controller
{
    public function __invoke(Statement $statement): Response
    {
        $this->authorize('view', $statement);

        $statement->load([
            'referrer',
            'invoices' => function ($query) {
                $reportDateSubquery = DB::table('acceptance_items')
                    ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
                    ->join('methods', 'methods.id', '=', 'method_tests.method_id')
                    ->selectRaw('MAX(DATE_ADD(acceptance_items.created_at, INTERVAL methods.turnaround_time DAY))')
                    ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id');

                $query->with([
                    "acceptance" => function ($q) use ($reportDateSubquery) {
                        $q->with("patient")->addSelect(['report_date' => $reportDateSubquery]);
                    },
                    "acceptanceItems.test",
                    "acceptanceItems.report:id,published_at,acceptance_item_id",
                ])
                    ->withSum("payments", "price")
                    ->withSum("acceptanceItems", "discount")
                    ->withSum("acceptanceItems", "price")
                    ->addSelect(DB::raw('CONCAT(
                        DATE_FORMAT(created_at, "%Y-%m"),
                        "/",
                        (SELECT COUNT(*)
                         FROM invoices i2
                         WHERE i2.id <= invoices.id
                         AND YEAR(i2.created_at) = YEAR(invoices.created_at)
                        )
                    ) AS invoice_no'));
            }
        ]);

        $invoices = $this->prepareInvoicesData($statement->invoices);

        $totals = [
            'gross_amount' => collect($invoices)->sum('gross_amount'),
            'discounts'    => collect($invoices)->sum(fn($r) => $r['item_discounts'] + $r['invoice_discount']),
            'net_amount'   => collect($invoices)->sum('net_amount'),
        ];

        return Inertia::render('Statement/Show', [
            'statement' => [
                'id'            => $statement->id,
                'no'            => $statement->no,
                'issue_date'    => Carbon::parse($statement->issue_date)->format('M d, Y'),
                'customer_name' => $statement->referrer?->fullName,
                'total_samples' => $statement->invoices->count(),
                'generated_at'  => $statement->updated_at?->format('M d, Y H:i'),
            ],
            'invoices' => $invoices,
            'totals'   => $totals,
        ]);
    }

    private function prepareInvoicesData(Collection $invoices): array
    {
        return $invoices->map(function ($invoice) {
            $grossAmount     = (float) ($invoice->acceptance_items_sum_price ?? 0);
            $itemDiscounts   = (float) ($invoice->acceptance_items_sum_discount ?? 0);
            $invoiceDiscount = (float) ($invoice->discount ?? 0);
            $netAmount       = $grossAmount - $itemDiscounts - $invoiceDiscount;

            $testCodes = $invoice->acceptanceItems->pluck('test.code')->filter()->unique()->sort()->join(', ') ?: 'N/A';
            $testNames = $invoice->acceptanceItems->pluck('test.fullName')->filter()->unique()->sort()->join(', ') ?: 'N/A';

            $acceptance = $invoice->acceptance;
            if ($acceptance->status === AcceptanceStatus::REPORTED) {
                $latestPublishedAt = $invoice->acceptanceItems->pluck('report.published_at')->filter()->max();
                $reportedAt = $latestPublishedAt
                    ? Carbon::parse($latestPublishedAt)->format('M d, Y')
                    : Carbon::parse($acceptance->updated_at)->format('M d, Y');
            } else {
                $reportedAt = $acceptance->report_date
                    ? Carbon::parse($acceptance->report_date)->format('M d, Y')
                    : 'Pending';
            }

            return [
                'invoice_no'       => $invoice->invoice_no,
                'acceptance_date'  => Carbon::parse($invoice->acceptance->created_at)->format('M d, Y'),
                'patient_name'     => $invoice->acceptance->patient->fullName ?? 'N/A',
                'test_codes'       => $testCodes,
                'test_names'       => $testNames,
                'gross_amount'     => $grossAmount,
                'item_discounts'   => $itemDiscounts,
                'invoice_discount' => $invoiceDiscount,
                'net_amount'       => $netAmount,
                'reported_at'      => $reportedAt,
                'payment_received' => (float) ($invoice->payments_sum_price ?? 0),
                'balance'          => $netAmount - (float) ($invoice->payments_sum_price ?? 0),
            ];
        })->toArray();
    }
}
