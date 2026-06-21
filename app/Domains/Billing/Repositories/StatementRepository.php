<?php

namespace App\Domains\Billing\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Billing\Models\Statement;
use Carbon\Carbon;
use Illuminate\Contracts\Database\Query\Expression;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;

class StatementRepository
{
    use LogsUserActivity;


    public function listStatements($queryData)
    {
        $query = Statement::with(["referrer"]);
        $query = $this->applyFilters($query, $queryData["filters"] ?? []);
        $query = $this->applyOrderBy($query, $queryData["sort"]);
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatStatement(array $statementData): Statement
    {
        $statement= Statement::query()->create([...$statementData, "no" => $this->generateStatementNumber($statementData["issue_date"])]);
        $this->logCreated($statement);
        return $statement;
    }

    public function updateStatement(Statement $statement, array $statementData): Statement
    {
        $statement->fill($statementData);
        if ($statement->isDirty()) {
            $statement->save();
            $this->logUpdated($statement);
        }
        return $statement;
    }

    public function deleteStatement(Statement $statement): void
    {
        $statement->delete();
        $this->logDeleted($statement);
    }

    public function findStatementById($id): ?Statement
    {
        return Statement::find($id);
    }

    public function getTotalStatementsForDateRange($dateRange): int
    {
        return Statement::whereBetween("created_at", $dateRange)->count();
    }

    /**
     * Load a statement with its invoices (and per-invoice totals, patient,
     * computed report_date and invoice_no) for the statement report view.
     */
    public function loadWithInvoicesForReport(Statement $statement): Statement
    {
        $reportDateSubquery = $this->reportDateSubquery();

        $statement->load([
            'referrer',
            'invoices' => function ($query) use ($reportDateSubquery) {
                $query->with([
                    'acceptance' => fn ($q) => $q->with('patient')->addSelect(['report_date' => $reportDateSubquery]),
                    'acceptanceItems.test',
                    'acceptanceItems.report:id,published_at,acceptance_item_id',
                ])
                    ->withSum('payments', 'price')
                    ->withSum('acceptanceItems', 'discount')
                    ->withSum('acceptanceItems', 'price')
                    ->addSelect($this->invoiceNoExpression());
            },
        ]);

        return $statement;
    }

    /**
     * Load a statement with its acceptances (tests, samples, invoice, patient
     * aggregates, payable amount and computed report_date) for resource output.
     */
    public function loadWithAcceptancesForResource(Statement $statement): Statement
    {
        $reportDateSubquery = $this->reportDateSubquery();

        $statement->load([
            "acceptances" => fn ($query) => $query->with([
                'acceptanceItems.test',
                'samples:samples.id,barcode',
                'invoice' => fn ($q) => $q->addSelect(['id', 'created_at', $this->invoiceNoExpression()]),
            ])
                ->withAggregate('patient', 'fullName')
                ->withAggregate('patient', 'idNo')
                ->selectRaw("({$this->payableAmountSql()}) as payable_amount")
                ->addSelect(['report_date' => $reportDateSubquery]),
            "referrer:id,fullName",
        ]);

        return $statement;
    }

    /**
     * Per-acceptance report date: the latest turnaround-time-adjusted due date
     * across the acceptance's items (skipping weekends).
     */
    private function reportDateSubquery(): QueryBuilder
    {
        return DB::table('acceptance_items')
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('methods', 'methods.id', '=', 'method_tests.method_id')
            ->selectRaw('MAX(DATE_ADD(acceptance_items.created_at, INTERVAL methods.turnaround_time + 2 * FLOOR((methods.turnaround_time + WEEKDAY(acceptance_items.created_at)) / 5) DAY))')
            ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id');
    }

    /**
     * Per-year sequential invoice number expression: "YYYY-MM/<rank within year>".
     */
    private function invoiceNoExpression(): Expression
    {
        return DB::raw('CONCAT(
            DATE_FORMAT(created_at, "%Y-%m"),
            "/",
            (SELECT COUNT(*)
             FROM invoices i2
             WHERE i2.id <= invoices.id
             AND YEAR(i2.created_at) = YEAR(invoices.created_at)
            )
        ) AS invoice_no');
    }

    private function payableAmountSql(): string
    {
        return 'COALESCE((SELECT SUM(acceptance_items.price) FROM acceptance_items WHERE acceptances.id = acceptance_items.acceptance_id), 0) -
                COALESCE((SELECT SUM(acceptance_items.discount) FROM acceptance_items WHERE acceptances.id = acceptance_items.acceptance_id), 0)';
    }

    private function applyFilters($query, array $filters)
    {
        if (isset($filters["referrer_id"])) {
            $query->where("referrer_id", strtolower($filters["referrer_id"]));
        }
        if (isset($filters["search"]))
            $query->search($filters["search"] ?? "");

        if (isset($filters["date"])) {
            $date = Carbon::parse($filters["date"]);
            $dateRange = [$date->startOfDay(), $date->copy()->endOfDay()];
            $query->whereBetween("issue_date", $dateRange);
        }
        return $query;
    }

    private function applyOrderBy($query, array $orderBy)
    {
        $query->orderBy($orderBy["field"], $orderBy["sort"]);
        return $query;
    }

    private function generateStatementNumber($date)
    {
        $date = Carbon::parse($date);
        return 'B-' . $date->format('Ym') . '-' . $this->countStatementOfMonth($date);
    }

    private function countStatementOfMonth(Carbon $date)
    {
        $dateRange = [$date->startOfMonth(), $date->copy()->endOfMonth()];
        return Statement::whereBetween("issue_date", $dateRange)->count();
    }

}
