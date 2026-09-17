<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Repositories;

use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class EmploymentContractRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['start_date', 'end_date', 'base_salary', 'created_at'];

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, EmploymentContract>
     */
    public function listContracts(array $queryData): LengthAwarePaginator
    {
        $filters = $queryData['filters'] ?? [];
        $field = $queryData['sort']['field'] ?? 'start_date';

        return EmploymentContract::query()
            ->with('user:id,name,attendance_number')
            ->when(! empty($filters['user_id']), fn (Builder $query) => $query->where('user_id', $filters['user_id']))
            ->when(! empty($filters['employment_type']), fn (Builder $query) => $query->where('employment_type', $filters['employment_type']))
            // "Running" is a date question, not a stored flag: a contract is current when today
            // falls inside it, and open-ended contracts have no end date at all.
            ->when(
                isset($filters['current']) && $filters['current'] !== '',
                fn (Builder $query) => filter_var($filters['current'], FILTER_VALIDATE_BOOLEAN)
                    ? $query->where('start_date', '<=', now()->toDateString())
                        ->where(fn (Builder $q) => $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString()))
                    : $query->where(fn (Builder $q) => $q->where('start_date', '>', now()->toDateString())
                        ->orWhere('end_date', '<', now()->toDateString()))
            )
            ->orderBy(
                in_array($field, self::SORTABLE, true) ? $field : 'start_date',
                ($queryData['sort']['sort'] ?? 'desc') === 'asc' ? 'asc' : 'desc'
            )
            ->paginate($queryData['pageSize'] ?? 10);
    }

    public function loadRows(EmploymentContract $contract): EmploymentContract
    {
        return $contract->load([
            'user:id,name,attendance_number,title',
            'entitlements.kind:id,name,is_paid',
        ]);
    }

    /**
     * The contract covering a date, if the person has one. Open-ended contracts have no end date.
     */
    public function coveringDate(int $userId, string $date): ?EmploymentContract
    {
        return EmploymentContract::query()
            ->where('user_id', $userId)
            ->where('start_date', '<=', $date)
            ->where(fn (Builder $query) => $query->whereNull('end_date')->orWhere('end_date', '>=', $date))
            ->with(['entitlements.kind:id,name,is_paid'])
            ->first();
    }

    /**
     * The contract that overlaps a period at all — a slip can be asked for a month the person
     * only worked part of. Contracts never overlap each other, so at most one can match.
     */
    public function overlappingPeriod(int $userId, string $from, string $to): ?EmploymentContract
    {
        return EmploymentContract::query()
            ->where('user_id', $userId)
            ->where('start_date', '<=', $to)
            ->where(fn (Builder $query) => $query->whereNull('end_date')->orWhere('end_date', '>=', $from))
            ->with(['entitlements.kind:id,name,is_paid', 'user:id,name,attendance_number,title'])
            ->orderByDesc('start_date')
            ->first();
    }

    /**
     * The person's newest contract by start date, whether or not it is still running.
     */
    public function latestForUser(int $userId, ?int $ignoreId = null): ?EmploymentContract
    {
        return EmploymentContract::query()
            ->where('user_id', $userId)
            ->when($ignoreId !== null, fn (Builder $query) => $query->whereKeyNot($ignoreId))
            ->orderByDesc('start_date')
            ->first();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): EmploymentContract
    {
        $contract = EmploymentContract::query()->make($data);
        $contract->save();
        $this->logCreated($contract);

        return $contract;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(EmploymentContract $contract, array $data): EmploymentContract
    {
        $contract->fill($data);
        if ($contract->isDirty()) {
            $contract->save();
            $this->logUpdated($contract);
        }

        return $contract;
    }

    /**
     * Replace the contract's entitlement rows with exactly these.
     *
     * @param  list<array<string, mixed>>  $rows
     */
    public function replaceEntitlements(EmploymentContract $contract, array $rows): void
    {
        $contract->entitlements()->delete();
        if ($rows !== []) {
            $contract->entitlements()->createMany($rows);
        }
    }

    public function delete(EmploymentContract $contract): void
    {
        $contract->delete();
        $this->logDeleted($contract);
    }
}
