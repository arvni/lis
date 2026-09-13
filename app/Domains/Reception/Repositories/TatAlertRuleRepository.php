<?php

declare(strict_types=1);

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\TatAlertRule;
use App\Domains\Shared\Traits\LogsUserActivity;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class TatAlertRuleRepository
{
    use LogsUserActivity;

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, TatAlertRule>
     */
    public function listRules(array $queryData): LengthAwarePaginator
    {
        $query = TatAlertRule::query()
            ->with(['tests:id,name', 'users:id,name', 'roles:id,name']);

        if (isset($queryData['filters'])) {
            $this->applyFilters($query, $queryData['filters']);
        }

        $query->orderBy(
            $queryData['sort']['field'] ?? 'id',
            $queryData['sort']['sort'] ?? 'desc'
        );

        return $query->paginate($queryData['pageSize'] ?? 10);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createRule(array $data): TatAlertRule
    {
        $rule = TatAlertRule::query()->make($data);
        $rule->save();
        $this->logCreated($rule);

        return $rule;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateRule(TatAlertRule $rule, array $data): TatAlertRule
    {
        $rule->fill($data);
        if ($rule->isDirty()) {
            $rule->save();
            $this->logUpdated($rule);
        }

        return $rule;
    }

    public function deleteRule(TatAlertRule $rule): void
    {
        $rule->delete();
        $this->logDeleted($rule);
    }

    /**
     * Active rules the daily job has not run yet today (every active rule when forced),
     * with the ids needed to find their items and recipients.
     *
     * @return Collection<int, TatAlertRule>
     */
    public function getRulesDueToRun(Carbon $today, bool $force = false): Collection
    {
        return TatAlertRule::query()
            ->where('active', true)
            ->when(! $force, fn (Builder $query) => $query->where(
                fn (Builder $q) => $q->whereNull('last_run_on')
                    ->orWhereDate('last_run_on', '<', $today->toDateString())
            ))
            ->with(['tests:id', 'users:id', 'roles:id'])
            ->get();
    }

    public function markRun(TatAlertRule $rule, Carbon $today): void
    {
        // Not mass-assignable on purpose: only the daily job sets it.
        $rule->forceFill(['last_run_on' => $today->toDateString()])->save();
    }

    /**
     * @param  Builder<TatAlertRule>  $query
     * @param  array<string, mixed>  $filters
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters['search'])) {
            $query->search(['name'], $filters['search']);
        }
        if (isset($filters['active']) && $filters['active'] !== '') {
            $query->where('active', filter_var($filters['active'], FILTER_VALIDATE_BOOLEAN));
        }
    }
}
