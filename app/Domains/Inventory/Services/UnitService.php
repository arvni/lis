<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Repositories\UnitRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class UnitService
{
    public function __construct(
        private UnitRepository $unitRepository,
    ) {}

    public function listUnits(array $filters): LengthAwarePaginator
    {
        return $this->unitRepository->listUnits($filters);
    }

    public function createUnit(array $data): Unit
    {
        return $this->unitRepository->createUnit($data);
    }

    public function updateUnit(Unit $unit, array $data): Unit
    {
        return $this->unitRepository->updateUnit($unit, $data);
    }

    public function deleteUnit(Unit $unit): void
    {
        $this->unitRepository->deleteUnit($unit);
    }

    public function allUnits(): \Illuminate\Database\Eloquent\Collection
    {
        return Unit::orderBy('name')->get();
    }
}
