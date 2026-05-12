<?php

namespace App\Domains\Billing\Repositories;

use App\Domains\Shared\Traits\FiltersByDateRange;
use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Statement;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceRepository
{
    use LogsUserActivity, FiltersByDateRange;


    public function listInvoices(array $queryData)
    {

        $query = $this->applyQuery(["owner", "acceptance", "patient", "statement"]);
        $query = $this->applyFilters($query, $queryData["filters"] ?? []);
        $query = $this->applyOrderBy($query, $queryData["sort"]);
        return $this->applyPaginate($query, $queryData["pageSize"] ?? 10);
    }

    public function listAllInvoices(array $queryData)
    {

        $query = $this->applyQuery(["owner", "patient", "payments", "acceptanceItems.method", "acceptanceItems.patient", "acceptanceItems.test", "statement"]);
        $query = $this->applyFilters($query, $queryData["filters"] ?? []);
        $query = $this->applyOrderBy($query, $queryData["sort"]);
        return $query->get();
    }

    public function creatInvoice(array $invoiceData): Invoice
    {
        $invoice= Invoice::query()->create($invoiceData);
        $this->logCreated($invoice);
        return $invoice;
    }

    public function updateInvoice(Invoice $invoice, array $invoiceData): Invoice
    {
        $invoice->fill($invoiceData);
        if ($invoice->isDirty()) {
            $invoice->save();
            $this->logUpdated($invoice);
        }
        return $invoice;
    }

    public function deleteInvoice(Invoice $invoice): void
    {
        $invoice->delete();
        $this->logDeleted($invoice);
    }

    public function findInvoiceById($id): ?Invoice
    {
        return Invoice::find($id);
    }

    public function listReferrerInvoicesForStatement(int $referrerId, ?string $month = null)
    {
        $query = $this->applyQuery(['acceptance.patient'])
            ->whereNull('invoices.statement_id')
            ->whereHas('acceptances', fn($q) => $q->where('referrer_id', $referrerId));

        if ($month) {
            $start = Carbon::parse($month . '-01')->startOfMonth();
            $end   = $start->copy()->endOfMonth();
            $query->whereBetween('invoices.created_at', [$start, $end]);
        }

        return $query->orderBy('invoices.id', 'desc')->get();
    }

    private function applyQuery($with = [])
    {
        $numberedInvoices = DB::table('invoices')
            ->select(
                'id',
                DB::raw('YEAR(created_at) AS year'),
                DB::raw('ROW_NUMBER() OVER (PARTITION BY YEAR(created_at) ORDER BY id ASC) AS row_num')
            );
        return Invoice::joinSub($numberedInvoices, 'numberedInvoices', function ($join) {
            $join->on('invoices.id', '=', 'numberedInvoices.id');
        })
            ->selectRaw("invoices.*,CONCAT(YEAR(invoices.created_at),'-',MONTH(invoices.created_at),'/',numberedInvoices.row_num) AS invoiceNo")
            ->with($with)
            ->withSum("payments", "price")
            ->withSum("acceptanceItems", "price")
            ->withSum("acceptanceItems", "discount")
            ->withAggregate("acceptance", "id");
    }

    private function applyFilters($query, array $filters)
    {
        // Owner type filter (polymorphic)
        if (isset($filters["owner_type"])) {
            $query->where("owner_type", strtolower($filters["owner_type"]));
            if (isset($filters["owner_id"]))
                $query->where("owner_id", $filters["owner_id"]);
        }

        $this->applyDateFilter($query, $filters, 'invoices.created_at');

        // Search filter
        if (isset($filters["search"]))
            $query->search($filters["search"] ?? "");

        // Invoice number filter (computed column)
        if (!empty($filters["invoice_no"]))
            $query->havingRaw("invoiceNo LIKE ?", ['%' . $filters["invoice_no"] . '%']);

        return $query;
    }

    private function applyOrderBy($query, array $orderBy)
    {
        $query->orderBy($orderBy["field"], $orderBy["sort"]);
        return $query;
    }

    private function applyPaginate($query, $pageSize): LengthAwarePaginator
    {
        return $query->paginate($pageSize);
    }


    public function getInvoiceNo(Invoice $invoice)
    {
        $created_at = Carbon::parse(($invoice->created_at));
        return "{$created_at->format('Y-m')}/" . $this->countInvoicesBeforeInThisYear($invoice->id, $created_at);
    }

    private function countInvoicesBeforeInThisYear($id, Carbon $created_at)
    {
        return Invoice::where("id", "<=", $id)->whereBetween("created_at", [$created_at->copy()->startOf("year")->toDate(), $created_at])->count();
    }

    public function updateMany(array $invoiceIds, Statement $statement)
    {
        $statement->invoices()->whereNotIn("id", $invoiceIds)->update(["statement_id" => null]);
        Invoice::query()->whereIn("id", $invoiceIds)
            ->whereNotIn("id", $statement->invoices->pluck("id"))
            ->update(["statement_id" => $statement->id]);
    }

}
