<?php

namespace App\Domains\Billing\Repositories;

use Illuminate\Database\Eloquent\Collection;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\FiltersByDateRange;
use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Statement;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceRepository
{
    use LogsUserActivity, FiltersByDateRange;


    public function listInvoices(array $queryData): LengthAwarePaginator
    {

        $query = $this->applyQuery(["owner", "acceptance", "patient", "statement"]);
        $query = $this->applyFilters($query, $queryData["filters"] ?? []);
        $query = $this->applyOrderBy($query, $queryData["sort"]);
        return $this->applyPaginate($query, $queryData["pageSize"] ?? 10);
    }

    public function listAllInvoices(array $queryData): Collection
    {

        $query = $this->applyQuery(["owner", "payments", "invoiceItems.acceptanceItems.patient", "invoiceItems.acceptanceItems.method", "statement"]);
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

    public function findInvoiceById(int|string $id): ?Invoice
    {
        return Invoice::find($id);
    }

    /**
     * Prepare an invoice's items for a rebuild: drop deletion tombstones (and any
     * swept rows) so removed test/panel lines return, and reset derived test/panel
     * rows to auto so the composer recomputes their price/qty/discount.
     */
    public function resetItemsForRebuild(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->invoiceItems()->onlyTrashed()->forceDelete();
            $invoice->invoiceItems()
                ->whereIn('kind', [InvoiceItemKind::TEST->value, InvoiceItemKind::PANEL->value])
                ->update(['locked_at' => null]);
        });
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
            ->withSum("invoiceItems", "price")
            ->withSum("invoiceItems", "discount")
            ->withSum("acceptanceItems", "price")
            ->withSum("acceptanceItems", "discount")
            ->withAggregate("acceptance", "id");
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Billing\Models\Invoice>  $query
     * @return \Illuminate\Database\Eloquent\Builder<\App\Domains\Billing\Models\Invoice>
     */
    private function applyFilters(Builder $query, array $filters): Builder
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

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Billing\Models\Invoice>  $query
     * @return \Illuminate\Database\Eloquent\Builder<\App\Domains\Billing\Models\Invoice>
     */
    private function applyOrderBy(Builder $query, array $orderBy): Builder
    {
        $query->orderBy($orderBy["field"], $orderBy["sort"]);
        return $query;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Billing\Models\Invoice>  $query
     */
    private function applyPaginate(Builder $query, int $pageSize): LengthAwarePaginator
    {
        return $query->paginate($pageSize);
    }


    public function getInvoiceNo(Invoice $invoice): string
    {
        $created_at = Carbon::parse(($invoice->created_at));
        return "{$created_at->format('Y-m')}/" . $this->countInvoicesBeforeInThisYear($invoice->id, $created_at);
    }

    private function countInvoicesBeforeInThisYear(int|string $id, Carbon $created_at): int
    {
        return Invoice::where("id", "<=", $id)->whereBetween("created_at", [$created_at->copy()->startOf("year")->toDate(), $created_at])->count();
    }

    public function updateMany(array $invoiceIds, Statement $statement): void
    {
        $statement->invoices()->whereNotIn("id", $invoiceIds)->update(["statement_id" => null]);
        Invoice::query()->whereIn("id", $invoiceIds)
            ->whereNotIn("id", $statement->invoices->pluck("id"))
            ->update(["statement_id" => $statement->id]);
    }

}
