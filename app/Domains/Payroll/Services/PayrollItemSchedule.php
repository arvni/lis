<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Services;

use App\Domains\Payroll\DTOs\PayrollItemAmount;
use App\Domains\Payroll\Enums\PayrollCalculation;
use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Shared\Helpers\AmountDistributor;
use Illuminate\Support\Carbon;

/**
 * Works out what one of a person's recurring items is worth in a given month.
 *
 * Has no dependencies and touches neither the database nor the clock, so the arithmetic — and the
 * loan arithmetic in particular — can be tested on its own.
 *
 * Instalments are numbered by what has actually been deducted, not by the calendar: the caller
 * passes in how many have already gone out on issued slips. A month that never produced a slip
 * therefore does not advance a loan, so its balance always matches what was really collected.
 */
class PayrollItemSchedule
{
    private const SCALE = 3;

    /**
     * @param  Carbon  $month  any day in the month the slip covers
     * @param  string|null  $basicSalary  the contract's basic salary, for percentage items
     * @param  int  $installmentsTaken  how many of this item's instalments have already been
     *                                  deducted on issued slips
     * @return PayrollItemAmount|null null when the item does not apply to this month at all
     */
    public function amountFor(
        PayrollItem $item,
        Carbon $month,
        ?string $basicSalary,
        int $installmentsTaken = 0,
    ): ?PayrollItemAmount {
        $first = $month->copy()->startOfMonth();
        $last = $month->copy()->endOfMonth();

        return match ($item->calculation) {
            PayrollCalculation::FIXED => $this->fixed($item, $first, $last),
            PayrollCalculation::PERCENTAGE => $this->percentage($item, $first, $last, $basicSalary),
            PayrollCalculation::INSTALLMENTS => $this->installment($item, $last, $installmentsTaken),
        };
    }

    private function fixed(PayrollItem $item, Carbon $first, Carbon $last): ?PayrollItemAmount
    {
        return $this->covers($item, $first, $last)
            ? new PayrollItemAmount($this->money((float) $item->amount))
            : null;
    }

    private function percentage(PayrollItem $item, Carbon $first, Carbon $last, ?string $basicSalary): ?PayrollItemAmount
    {
        if (! $this->covers($item, $first, $last)) {
            return null;
        }

        $percent = (float) $item->percentage;

        // A share of a salary nobody has recorded cannot be worked out. The line still appears, at
        // zero, so it is obvious something is owed rather than silently missing.
        if ($basicSalary === null) {
            return new PayrollItemAmount(
                $this->money(0),
                sprintf('%s of basic salary — no contract covers this month, so enter an amount', $this->percent($percent)),
            );
        }

        return new PayrollItemAmount(
            $this->money((float) $basicSalary * $percent / 100),
            sprintf('%s of %s', $this->percent($percent), $this->readable((float) $basicSalary)),
        );
    }

    private function installment(PayrollItem $item, Carbon $last, int $taken): ?PayrollItemAmount
    {
        $count = $item->installments ?? 0;
        // The next one owed, rather than whichever the calendar would suggest.
        $number = $taken + 1;

        // Before it starts, or once it is paid off, there is nothing to take.
        if ($count < 1 || $item->start_date->gt($last) || $number > $count) {
            return null;
        }

        $total = (float) $item->total_amount;
        // Largest-remainder, at storage precision, so the instalments sum back to the exact total
        // instead of losing a baisa a month. The default is whole units, hence the explicit scale.
        $shares = AmountDistributor::distribute($total, $count, self::SCALE);
        $remaining = $total - array_sum(array_slice($shares, 0, $number));

        return new PayrollItemAmount(
            $this->money($shares[$number - 1]),
            sprintf(
                'instalment %d of %d · %s remaining',
                $number,
                $count,
                $this->readable(max(0.0, $remaining)),
            ),
            $number,
        );
    }

    /** Whether a dated item is live at any point in the month. */
    private function covers(PayrollItem $item, Carbon $first, Carbon $last): bool
    {
        return $item->start_date->lte($last)
            && ($item->end_date === null || $item->end_date->gte($first));
    }

    private function percent(float $percent): string
    {
        return rtrim(rtrim(number_format($percent, self::SCALE, '.', ''), '0'), '.').'%';
    }

    /** A figure the slip will do arithmetic on: no separators, so it parses cleanly. */
    private function money(float $value): string
    {
        return number_format(round($value, self::SCALE), self::SCALE, '.', '');
    }

    /** The same figure inside a sentence, grouped so it reads like the rest of the printed sheet. */
    private function readable(float $value): string
    {
        return number_format(round($value, self::SCALE), self::SCALE, '.', ',');
    }
}
