<?php

namespace App\Domains\Billing\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Billing\Models\Statement;
use Carbon\Carbon;

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
