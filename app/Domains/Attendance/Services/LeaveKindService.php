<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\DTOs\LeaveKindDTO;
use App\Domains\Attendance\Models\LeaveKind;
use App\Domains\Attendance\Repositories\LeaveKindRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use RuntimeException;

class LeaveKindService
{
    public function __construct(private readonly LeaveKindRepository $kindRepository) {}

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, LeaveKind>
     */
    public function listKinds(array $queryData): LengthAwarePaginator
    {
        return $this->kindRepository->listKinds($queryData);
    }

    /**
     * @return Collection<int, LeaveKind>
     */
    public function activeKinds(): Collection
    {
        return $this->kindRepository->activeKinds();
    }

    public function storeKind(LeaveKindDTO $dto): LeaveKind
    {
        return $this->kindRepository->create($dto->toArray());
    }

    public function updateKind(LeaveKind $kind, LeaveKindDTO $dto): LeaveKind
    {
        return $this->kindRepository->update($kind, $dto->toArray());
    }

    /**
     * @throws RuntimeException while any leave request uses the kind
     */
    public function deleteKind(LeaveKind $kind): void
    {
        if ($this->kindRepository->isInUse($kind)) {
            throw new RuntimeException("$kind->name is used by leave requests, so it can't be deleted. Mark it inactive instead.");
        }

        $this->kindRepository->delete($kind);
    }
}
