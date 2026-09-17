<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Services;

use App\Domains\Payroll\Adapters\AttendanceAdapter;
use App\Domains\Payroll\DTOs\ContractEntitlementDTO;
use App\Domains\Payroll\DTOs\EmploymentContractDTO;
use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\Payroll\Repositories\EmploymentContractRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Contracts are the record of what someone is employed on, so they are kept as history: a person's
 * contracts never overlap, and ending one early means setting its end date rather than deleting it.
 */
class EmploymentContractService
{
    public function __construct(
        private readonly EmploymentContractRepository $contractRepository,
        private readonly AttendanceAdapter $attendance,
    ) {}

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, EmploymentContract>
     */
    public function listContracts(array $queryData): LengthAwarePaginator
    {
        return $this->contractRepository->listContracts($queryData);
    }

    public function loadContract(EmploymentContract $contract): EmploymentContract
    {
        return $this->contractRepository->loadRows($contract);
    }

    /**
     * Start a contract. A contract that is still running when the new one starts is closed the day
     * before, so the person is never on two contracts at once.
     *
     * @throws RuntimeException when the new contract would not start after the person's latest one
     */
    public function storeContract(EmploymentContractDTO $dto): EmploymentContract
    {
        return DB::transaction(function () use ($dto) {
            $start = Carbon::parse($dto->startDate)->startOfDay();
            $latest = $this->contractRepository->latestForUser($dto->userId);

            if ($latest !== null) {
                if ($start->lte($latest->start_date)) {
                    throw new RuntimeException(
                        'A new contract has to start after '.$latest->start_date->format('Y-m-d').', when this person’s latest contract starts.'
                    );
                }

                $dayBefore = $start->copy()->subDay();
                if ($latest->end_date === null || $latest->end_date->gt($dayBefore)) {
                    $this->contractRepository->update($latest, ['end_date' => $dayBefore->toDateString()]);
                }
            }

            $contract = $this->contractRepository->create($dto->toArray());
            $this->writeRows($contract, $dto);
            $this->syncShift($dto);

            return $contract;
        });
    }

    /**
     * @throws RuntimeException when the edited period would overlap another of the person's contracts
     */
    public function updateContract(EmploymentContract $contract, EmploymentContractDTO $dto): EmploymentContract
    {
        return DB::transaction(function () use ($contract, $dto) {
            $this->assertNoOverlap($contract, $dto);

            $this->contractRepository->update($contract, $dto->toArray());
            $this->writeRows($contract, $dto);
            $this->syncShift($dto);

            return $contract;
        });
    }

    public function deleteContract(EmploymentContract $contract): void
    {
        // The rows go with it: both are cascade-deleted, and neither means anything on its own.
        $this->contractRepository->delete($contract);
    }

    /**
     * Editing a contract can move its dates onto a neighbour, which starting one cannot.
     *
     * @throws RuntimeException
     */
    private function assertNoOverlap(EmploymentContract $contract, EmploymentContractDTO $dto): void
    {
        $other = $this->contractRepository->latestForUser($dto->userId, $contract->id);
        if ($other === null) {
            return;
        }

        $start = Carbon::parse($dto->startDate)->startOfDay();
        $end = $dto->endDate === null ? null : Carbon::parse($dto->endDate)->startOfDay();

        $startsBeforeOtherEnds = $other->end_date === null || $other->end_date->gte($start);
        $endsAfterOtherStarts = $end === null || $end->gte($other->start_date);

        if ($startsBeforeOtherEnds && $endsAfterOtherStarts) {
            throw new RuntimeException(
                'This period overlaps the contract starting '.$other->start_date->format('Y-m-d').'. Change the dates so the two don’t run at the same time.'
            );
        }
    }

    /**
     * Put the person on the picked shift from the contract's start.
     *
     * The shift is not stored on the contract: it is written to their shift assignment, so the
     * hours a salary slip prices overtime at are the same hours attendance measured it against.
     * Picking the shift they are already on does nothing — otherwise every edit would trip
     * Attendance's rule that a new assignment has to start after the latest one.
     *
     * @throws RuntimeException when Attendance refuses the assignment
     */
    private function syncShift(EmploymentContractDTO $dto): void
    {
        if ($dto->shiftId === null) {
            return;
        }

        if ($this->attendance->assignedShiftId($dto->userId, $dto->startDate) === $dto->shiftId) {
            return;
        }

        try {
            $this->attendance->assignShift($dto->userId, $dto->shiftId, $dto->startDate);
        } catch (RuntimeException $e) {
            throw new RuntimeException('The contract was not saved: '.$e->getMessage());
        }
    }

    private function writeRows(EmploymentContract $contract, EmploymentContractDTO $dto): void
    {
        $this->contractRepository->replaceEntitlements(
            $contract,
            array_map(fn (ContractEntitlementDTO $row) => $row->toArray(), $dto->entitlements),
        );
    }
}
