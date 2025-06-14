<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Referrer\Models\OrderMaterial;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use InvalidArgumentException;

class OrderMaterialRepository
{

    public function listOrderMaterials(array $queryData): LengthAwarePaginator
    {
        $query = OrderMaterial::query()
            ->withAggregate("referrer", "fullName")
            ->withAggregate("sampleType", "name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function updateOrderMaterial(OrderMaterial $orderMaterial, array $orderMaterialData): OrderMaterial
    {
        $orderMaterial->fill($orderMaterialData);
        if ($orderMaterial->isDirty())
            $orderMaterial->save();
        return $orderMaterial;
    }

    public function deleteOrderMaterial(OrderMaterial $orderMaterial): void
    {
        $orderMaterial->delete();
    }

    protected function applyFilters($query, array $filters)
    {
        // Define filter mappings for cleaner code
        $simpleFilters = [
            'sampleType' => 'sample_type_id',
            'referrer' => 'referrer_id',
        ];

        // Apply simple ID-based filters
        foreach ($simpleFilters as $filterKey => $columnName) {
            if ($this->hasNestedId($filters, $filterKey)) {
                $query->where($columnName, $filters[$filterKey]['id']);
            }
        }

        // Apply date range filters
        $dateFilters = [
            'expire_date' => 'created_date',
        ];

        foreach ($dateFilters as $filterKey => $columnName) {
            if (!empty($filters[$filterKey])) {
                $this->applyDateRangeFilter($query, $columnName, $filters[$filterKey]);
            }
        }

        // Apply search filter
        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }
        return $query;
    }

    /**
     * Check if a nested ID exists in the filters array
     */
    private function hasNestedId(array $filters, string $key): bool
    {
        return !empty($filters[$key]['id']);
    }

    /**
     * Apply date range filter to the query
     */
    private function applyDateRangeFilter($query, string $field, array $dateFilter): void
    {
        $timezone = config('app.timezone', 'Asia/Muscat');

        $hasFrom = !empty($dateFilter['from']);
        $hasTo = !empty($dateFilter['to']);

        // If neither date is provided, skip filtering
        if (!$hasFrom && !$hasTo) {
            return;
        }

        // Both dates provided - use whereBetween
        if ($hasFrom && $hasTo) {
            $fromDate = $this->ensureCarbonDate($dateFilter['from'], $timezone)->startOfDay();
            $toDate = $this->ensureCarbonDate($dateFilter['to'], $timezone)->endOfDay();

            // Validate date range
            if ($fromDate->gt($toDate)) {
                throw new InvalidArgumentException("'From' date must be before or equal to 'To' date for field: {$field}");
            }

            $query->whereBetween($field, [$fromDate, $toDate]);
        } // Only 'from' date provided - use where >=
        elseif ($hasFrom) {
            $fromDate = $this->ensureCarbonDate($dateFilter['from'], $timezone)->startOfDay();
            $query->where($field, '>=', $fromDate);
        } // Only 'to' date provided - use where <=
        else {
            $toDate = $this->ensureCarbonDate($dateFilter['to'], $timezone)->endOfDay();
            $query->where($field, '<=', $toDate);
        }
    }

    /**
     * Ensure the given date is a Carbon instance
     */
    private function ensureCarbonDate($date, string $timezone): Carbon
    {
        if ($date instanceof Carbon) {
            return $date->timezone($timezone);
        }

        try {
            return Carbon::parse($date, $timezone);
        } catch (Exception $e) {
            throw new InvalidArgumentException("Invalid date format: {$date}");
        }
    }

}
