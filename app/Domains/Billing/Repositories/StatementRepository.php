<?php

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Models\Statement;
use Carbon\Carbon;

class StatementRepository
{

    public function listStatements($queryData)
    {
        $query = Statement::with(["referrer"]);
        $query = $this->applyFilters($query, $queryData["filters"] ?? []);
        $query = $this->applyOrderBy($query, $queryData["sort"]);
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatStatement(array $statementData): Statement
    {
        return Statement::query()->create([...$statementData, "no" => $this->generateStatementNumber($statementData["issue_date"])]);
    }

    public function updateStatement(Statement $statement, array $statementData): Statement
    {
        $statement->fill($statementData);
        if ($statement->isDirty())
            $statement->save();
        return $statement;
    }

    public function deleteStatement(Statement $statement): void
    {
        $statement->delete();
    }

    public function findStatementById($id): ?Statement
    {
        return Statement::find($id);
    }

    public function getTotalStatementsForDateRange($dateRange): float
    {
        return Statement::whereBetween("created_at", $dateRange);
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
        return 'A440-' . $date->format('Ym') . '-' . $this->countStatementOfMonth($date);
    }

    private function countStatementOfMonth(Carbon $date)
    {
        $dateRange = [$date->startOfMonth(), $date->copy()->endOfMonth()];
        return Statement::whereBetween("issue_date", $dateRange)->count();
    }

}
