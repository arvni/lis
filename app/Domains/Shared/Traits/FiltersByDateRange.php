<?php

namespace App\Domains\Shared\Traits;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

trait FiltersByDateRange
{
    protected function applyDateFilter(Builder $query, array $filters, string $column = 'created_at'): void
    {
        if (isset($filters['date'])) {
            $date = Carbon::parse($filters['date']);
            $query->whereBetween($column, [$date->copy()->startOfDay(), $date->copy()->endOfDay()]);
        }

        if (!empty($filters['from_date']) || !empty($filters['to_date'])) {
            $startDate = !empty($filters['from_date'])
                ? Carbon::parse($filters['from_date'])->startOfDay()
                : Carbon::createFromTimestamp(0);
            $endDate = !empty($filters['to_date'])
                ? Carbon::parse($filters['to_date'])->endOfDay()
                : now();
            $query->whereBetween($column, [$startDate, $endDate]);
        }
    }
}
