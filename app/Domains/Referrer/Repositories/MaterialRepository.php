<?php

namespace App\Domains\Referrer\Repositories;

use App\Domains\Referrer\Models\Material;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Carbon\Carbon;
use DB;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;

class MaterialRepository
{

    public function listMaterials(array $queryData): LengthAwarePaginator
    {
        $query = Material::query()
            ->withAggregate("referrer", "fullName")
            ->withAggregate("sampleType", "name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }


    public function listPackingSeriesMaterials(array $queryData): LengthAwarePaginator
    {
        $query = Material::query()
            ->select(
                'packing_series',
                DB::raw('count(*) as material_count'),
                DB::raw('MIN(id) as id'),
                DB::raw('MIN(sample_type_id) as sample_type_id'),
                DB::raw('MIN(created_at) as created_at'),
            )
            ->groupBy('packing_series', 'sample_type_id')
            ->withAggregate("sampleType", "name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function getAll(array $queryData): Collection
    {
        $query = Material::query()->withAggregate("sampleType", "name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->get();
    }

    public function creatMaterial(array $materialData): Material
    {
        $material = Material::query()->make($materialData);
        $material->save();
        UserActivityService::createUserActivity($material,ActivityType::CREATE);
        return $material;
    }

    public function updateMaterial(Material $material, array $materialData): Material
    {
        $material->fill($materialData);
        if ($material->isDirty()) {
            $material->save();
            UserActivityService::createUserActivity($material,ActivityType::UPDATE);
        }
        return $material;
    }

    public function deleteMaterial(Material $material): void
    {
        $material->delete();
        UserActivityService::createUserActivity($material,ActivityType::DELETE);
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
            'expire_date' => 'expire_date',
            'assigned_at' => 'assigned_at',
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
        if (!empty($filters['packing_series'])) {
            $query->where("packing_series", $filters['packing_series']);
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

    public function isBarcodeAvailableToAssign($barcode, $sampleTypeId): bool
    {
        return Material::query()
            ->where('barcode', $barcode)
            ->where("sample_type_id", $sampleTypeId)
            ->whereNull("order_material_id")
            ->whereNull('assigned_at')
            ->exists();
    }

    public function getByBarcode($barcode)
    {
        return Material::query()->where("barcode", $barcode)->first();
    }

    public function getById($id)
    {
        return Material::find($id);
    }

}
