<?php

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceRepository
{

    public function listInvoices(array $queryData)
    {

        $query = $this->applyQuery(["owner", "acceptance", "patient"]);
        $query = $this->applyFilters($query, $queryData["filters"] ?? []);
        $query = $this->applyOrderBy($query, $queryData["sort"]);
        return $this->applyPaginate($query, $queryData["pageSize"] ?? 10);
    }

    public function listAllInvoices(array $queryData)
    {

        $query = $this->applyQuery(["owner", "patient", "payments", "acceptanceItems.method","acceptanceItems.patient", "acceptanceItems.test"]);
        $query = $this->applyFilters($query, $queryData["filters"] ?? []);
        $query = $this->applyOrderBy($query, $queryData["sort"]);
        return $query->get();
    }

    public function creatInvoice(array $invoiceData): Invoice
    {
        return Invoice::query()->create($invoiceData);
    }

    public function updateInvoice(Invoice $invoice, array $invoiceData): Invoice
    {
        $invoice->fill($invoiceData);
        if ($invoice->isDirty())
            $invoice->save();
        return $invoice;
    }

    public function deleteInvoice(Invoice $invoice): void
    {
        $invoice->delete();
    }

    public function findInvoiceById($id): ?Invoice
    {
        return Invoice::find($id);
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
        if (isset($filters["owner"])) {
            $query
                ->whereHasMorph("owner", "App\\Models\\" . ucfirst($filters["owner"]), function ($q) use ($filters) {
                    $q->where(Str::lower($filters["owner"]) . "s.id", $filters["id"]);
                });
        }
        if (isset($filters["search"]))
            $query->search($filters["search"] ?? "");
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

    private function countInvoicesBeforeInThisYear($id,Carbon $created_at)
    {
        return Invoice::where("id", "<=", $id)->whereBetween("created_at", [$created_at->copy()->startOf("year")->toDate(), $created_at])->count();
    }

}
