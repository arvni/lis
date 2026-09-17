<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Services;

use App\Domains\Payroll\DTOs\PayrollItemDTO;
use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Payroll\Repositories\PayrollItemRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * A person's recurring allowances and deductions. They belong to the person rather than to any
 * contract, so replacing a contract leaves a loan exactly where it was.
 */
class PayrollItemService
{
    public function __construct(private readonly PayrollItemRepository $itemRepository) {}

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, PayrollItem>
     */
    public function listItems(array $queryData): LengthAwarePaginator
    {
        return $this->itemRepository->listItems($queryData);
    }

    /**
     * @return Collection<int, PayrollItem>
     */
    public function forUserInMonth(int $userId, string $from, string $to): Collection
    {
        return $this->itemRepository->forUserInMonth($userId, $from, $to);
    }

    public function storeItem(PayrollItemDTO $dto): PayrollItem
    {
        return $this->itemRepository->loadRelations($this->itemRepository->create($dto->toArray()));
    }

    public function updateItem(PayrollItem $item, PayrollItemDTO $dto): PayrollItem
    {
        return $this->itemRepository->update($item, $dto->toArray());
    }

    public function deleteItem(PayrollItem $item): void
    {
        // Nothing guards this: an item is a standing instruction, and removing it simply stops it.
        // Past slips are not stored, so there is nothing left behind to contradict.
        $this->itemRepository->delete($item);
    }
}
