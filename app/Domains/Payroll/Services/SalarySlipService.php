<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Services;

use App\Domains\Payroll\Adapters\AttendanceAdapter;
use App\Domains\Payroll\Adapters\UserAdapter;
use App\Domains\Payroll\DTOs\GeneratedSlip;
use App\Domains\Payroll\Enums\PayrollCalculation;
use App\Domains\Payroll\Enums\SalarySlipStatus;
use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\Payroll\Models\SalarySlipLine;
use App\Domains\Payroll\Repositories\EmploymentContractRepository;
use App\Domains\Payroll\Repositories\SalarySlipRepository;
use App\Domains\User\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Salary slips are prepared, edited, and then issued to the person they belong to.
 *
 * A slip keeps the figures it was generated from, so an issued one goes on saying what it said
 * even after a contract is changed or an attendance day is corrected. Regenerating is therefore a
 * deliberate act, not something that happens quietly on every view.
 */
class SalarySlipService
{
    public function __construct(
        private readonly EmploymentContractRepository $contractRepository,
        private readonly SalarySlipRepository $slipRepository,
        private readonly AttendanceAdapter $attendance,
        private readonly LeaveBalanceService $leaveBalanceService,
        private readonly PayrollItemService $payrollItemService,
        private readonly SalarySlipBuilder $builder,
        private readonly SalarySlipNumberService $numbers,
        private readonly UserAdapter $userAdapter,
    ) {}

    public function findPerson(int $userId): User
    {
        return $this->userAdapter->findUserOrFail($userId);
    }

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, SalarySlip>
     */
    public function listSlips(array $queryData, ?int $onlyUserId = null): LengthAwarePaginator
    {
        return $this->slipRepository->listSlips($queryData, $onlyUserId);
    }

    public function loadForViewing(SalarySlip $slip): SalarySlip
    {
        return $this->slipRepository->loadForViewing($slip);
    }

    /**
     * Work up a draft for a person's month.
     *
     * @throws RuntimeException when a slip already exists, or no contract covers the month
     */
    public function generate(int $userId, Carbon $month, int $createdBy): GeneratedSlip
    {
        $from = $month->copy()->startOfMonth()->toDateString();
        $to = $month->copy()->endOfMonth()->toDateString();

        if ($this->slipRepository->findForMonth($userId, $from) !== null) {
            throw new RuntimeException('There is already a salary slip for this person and month. Open it instead of making another.');
        }

        $contract = $this->contractRepository->overlappingPeriod($userId, $from, $to);
        if ($contract === null) {
            throw new RuntimeException('No contract covers this month, so there is nothing to work a slip out from.');
        }

        $items = $this->payrollItemService->forUserInMonth($userId, $from, $to);
        $taken = $this->slipRepository->installmentsTakenFor(
            $items->map(fn (PayrollItem $item) => $item->id)->all(),
        );

        $slip = $this->builder->compose(
            $contract,
            $from,
            $to,
            $this->attendance->attendanceTotals($userId, $from, $to),
            $this->attendance->scheduledMinutes($userId, $from, $to),
            $this->attendance->workingDayMinutes($userId, $from),
            $this->leaveBalanceService->unpaidLeaveIn($userId, $from, $to),
            $this->leaveBalanceService->forContract($contract),
            $items,
            $taken,
        );
        $slip->created_by = $createdBy;

        $saved = DB::transaction(function () use ($slip) {
            /** @var list<SalarySlipLine> $lines */
            $lines = $slip->getRelation('lines')->all();
            $this->slipRepository->save($slip);
            $this->slipRepository->replaceLines($slip, array_map(
                fn (SalarySlipLine $line) => $line->only([
                    'code', 'label', 'amount', 'note', 'payroll_item_id', 'installment_number', 'sort_order',
                ]),
                $lines,
            ));

            return $this->slipRepository->loadForViewing($slip);
        });

        return new GeneratedSlip($saved, $this->instalmentGaps($items, $taken, Carbon::parse($from)));
    }

    /**
     * Loans whose instalments have fallen behind the calendar.
     *
     * Instalments count what has actually been deducted, so a month that never produced an issued
     * slip does not advance them. That is the intended behaviour, but it also means a loan can
     * quietly end up collecting less than it should — worth saying, rather than leaving to be
     * noticed a year later.
     *
     * @param  iterable<PayrollItem>  $items
     * @param  array<int, int>  $taken
     * @return list<string>
     */
    private function instalmentGaps(iterable $items, array $taken, Carbon $month): array
    {
        $warnings = [];

        foreach ($items as $item) {
            if ($item->calculation !== PayrollCalculation::INSTALLMENTS) {
                continue;
            }

            $ledger = ($taken[$item->id] ?? 0) + 1;
            $calendar = ($month->year - $item->start_date->year) * 12
                + ($month->month - $item->start_date->month) + 1;

            // Already paid off, or not started: nothing to fall behind.
            if ($ledger > ($item->installments ?? 0) || $calendar < 1 || $ledger >= $calendar) {
                continue;
            }

            $warnings[] = sprintf(
                '%s is on instalment %d of %d, but this is month %d since it started. %d earlier month(s) have no issued slip, so the loan is collecting more slowly than planned.',
                $item->type->name,
                $ledger,
                $item->installments ?? 0,
                $calendar,
                $calendar - $ledger,
            );
        }

        return $warnings;
    }

    /**
     * Replace the slip's lines with what the payroll user settled on, and re-add the net.
     *
     * @param  list<array<string, mixed>>  $lines
     */
    public function updateLines(SalarySlip $slip, array $lines, ?string $notes): SalarySlip
    {
        return DB::transaction(function () use ($slip, $lines, $notes) {
            $rows = [];
            foreach (array_values($lines) as $index => $line) {
                $rows[] = [
                    'code' => $line['code'] ?? SalarySlipLine::ITEM,
                    'label' => $line['label'],
                    'amount' => $line['amount'],
                    'note' => $line['note'] ?? null,
                    // Kept so a loan's instalment stays attributed to the item that produced it.
                    'payroll_item_id' => $line['payroll_item_id'] ?? null,
                    'installment_number' => $line['installment_number'] ?? null,
                    'sort_order' => $index,
                ];
            }

            $this->slipRepository->replaceLines($slip, $rows);
            $this->slipRepository->update($slip, [
                'net' => $this->sum($rows),
                'notes' => $notes,
            ]);

            return $this->slipRepository->loadForViewing($slip);
        });
    }

    /**
     * Give the slip to the employee. It is numbered now rather than when it was drafted, so a slip
     * that never goes out does not use a number up.
     *
     * @throws RuntimeException when it has already been issued
     */
    public function issue(SalarySlip $slip, int $issuedBy): SalarySlip
    {
        if ($slip->isIssued()) {
            throw new RuntimeException('This slip has already been issued.');
        }

        return DB::transaction(function () use ($slip, $issuedBy) {
            $this->slipRepository->update($slip, [
                'status' => SalarySlipStatus::ISSUED->value,
                'number' => $slip->number ?? $this->numbers->next(),
                'issued_at' => now(),
                'issued_by' => $issuedBy,
            ]);

            return $this->slipRepository->loadForViewing($slip);
        });
    }

    public function deleteSlip(SalarySlip $slip): void
    {
        $this->slipRepository->delete($slip);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function sum(array $rows): string
    {
        $total = array_sum(array_map(fn (array $row) => (float) $row['amount'], $rows));

        return number_format(round($total, 3), 3, '.', '');
    }
}
