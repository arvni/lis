<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Services;

use App\Domains\Payroll\DTOs\PayrollItemTypeDTO;
use App\Domains\Payroll\Models\PayrollItemType;
use App\Domains\Payroll\Repositories\PayrollItemTypeRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use RuntimeException;

class PayrollItemTypeService
{
    public function __construct(private readonly PayrollItemTypeRepository $typeRepository) {}

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, PayrollItemType>
     */
    public function listTypes(array $queryData): LengthAwarePaginator
    {
        return $this->typeRepository->listTypes($queryData);
    }

    /**
     * @return Collection<int, PayrollItemType>
     */
    public function activeTypes(): Collection
    {
        return $this->typeRepository->activeTypes();
    }

    public function storeType(PayrollItemTypeDTO $dto): PayrollItemType
    {
        return $this->typeRepository->create($dto->toArray());
    }

    public function updateType(PayrollItemType $type, PayrollItemTypeDTO $dto): PayrollItemType
    {
        return $this->typeRepository->update($type, $dto->toArray());
    }

    /**
     * @throws RuntimeException while any contract still carries the item
     */
    public function deleteType(PayrollItemType $type): void
    {
        if ($this->typeRepository->isInUse($type)) {
            throw new RuntimeException("$type->name is on at least one contract, so it can't be deleted. Mark it inactive instead.");
        }

        $this->typeRepository->delete($type);
    }
}
