<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Repositories;

use App\Domains\Payroll\Enums\SalarySlipStatus;
use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\Payroll\Models\SalarySlipLine;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class SalarySlipRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['period_from', 'status', 'net', 'created_at'];

    /**
     * @param  array<string, mixed>  $queryData
     * @param  int|null  $onlyUserId  restrict to one person's slips; used for anyone who may only
     *                                see their own
     * @return LengthAwarePaginator<int, SalarySlip>
     */
    public function listSlips(array $queryData, ?int $onlyUserId = null): LengthAwarePaginator
    {
        $filters = $queryData['filters'] ?? [];
        $field = $queryData['sort']['field'] ?? 'period_from';

        return SalarySlip::query()
            ->with(['user:id,name,attendance_number'])
            ->when($onlyUserId !== null, fn (Builder $query) => $query
                ->where('user_id', $onlyUserId)
                // Someone seeing their own slips sees the ones they were actually given, never a
                // draft still being worked on.
                ->where('status', SalarySlipStatus::ISSUED->value))
            ->when(! empty($filters['user_id']), fn (Builder $query) => $query->where('user_id', $filters['user_id']))
            ->when(! empty($filters['status']), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when(! empty($filters['month']), fn (Builder $query) => $query->where('period_from', $filters['month'].'-01'))
            ->orderBy(
                in_array($field, self::SORTABLE, true) ? $field : 'period_from',
                ($queryData['sort']['sort'] ?? 'desc') === 'asc' ? 'asc' : 'desc'
            )
            ->paginate($queryData['pageSize'] ?? 10);
    }

    public function loadForViewing(SalarySlip $slip): SalarySlip
    {
        return $slip->load([
            'user:id,name,attendance_number,title',
            'lines',
            'issuedBy:id,name',
            'contract:id,start_date,end_date',
        ]);
    }

    public function findForMonth(int $userId, string $periodFrom): ?SalarySlip
    {
        return SalarySlip::query()
            ->where('user_id', $userId)
            ->where('period_from', $periodFrom)
            ->first();
    }

    /**
     * How many instalments of each item have already gone out on issued slips.
     *
     * The highest number recorded is used rather than a count, so a line removed by hand leaves a
     * gap instead of quietly handing the same instalment out twice.
     *
     * @param  list<int>  $payrollItemIds
     * @return array<int, int> keyed by payroll item id
     */
    public function installmentsTakenFor(array $payrollItemIds, ?int $ignoreSlipId = null): array
    {
        if ($payrollItemIds === []) {
            return [];
        }

        $rows = SalarySlipLine::query()
            ->whereIn('payroll_item_id', $payrollItemIds)
            ->whereNotNull('installment_number')
            ->whereHas('slip', fn (Builder $query) => $query
                ->where('status', SalarySlipStatus::ISSUED->value)
                // A slip being regenerated must not count its own previous instalment.
                ->when($ignoreSlipId !== null, fn (Builder $inner) => $inner->whereKeyNot($ignoreSlipId)))
            ->groupBy('payroll_item_id')
            ->selectRaw('payroll_item_id, MAX(installment_number) AS taken')
            ->toBase()
            ->get();

        $taken = [];
        foreach ($rows as $row) {
            $taken[(int) $row->payroll_item_id] = (int) $row->taken;
        }

        return $taken;
    }

    /**
     * Numbers already given out this year, locked so two slips issued at once cannot share one.
     *
     * @return Collection<int, SalarySlip>
     */
    public function lockNumbersStartingWith(string $prefix): Collection
    {
        return SalarySlip::query()
            ->where('number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->get(['id', 'number']);
    }

    public function save(SalarySlip $slip): SalarySlip
    {
        $slip->save();

        return $slip;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(SalarySlip $slip, array $data): SalarySlip
    {
        $slip->fill($data);
        if ($slip->isDirty()) {
            $slip->save();
            $this->logUpdated($slip);
        }

        return $slip;
    }

    /**
     * Replace the slip's lines with exactly these.
     *
     * @param  list<array<string, mixed>>  $rows
     */
    public function replaceLines(SalarySlip $slip, array $rows): void
    {
        $slip->lines()->delete();
        if ($rows !== []) {
            $slip->lines()->createMany($rows);
        }
        $slip->unsetRelation('lines');
    }

    public function delete(SalarySlip $slip): void
    {
        $slip->delete();
        $this->logDeleted($slip);
    }
}
