<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Services;

use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\Payroll\Repositories\SalarySlipRepository;

/**
 * Numbers a slip when it is issued, so the employee has something to quote. Drafts stay unnumbered,
 * which keeps a number from being used up by a slip that is never given out.
 */
readonly class SalarySlipNumberService
{
    public function __construct(private SalarySlipRepository $slipRepository) {}

    /** Format: SLP-{YYYY}-{XXXX}. Call it inside the issuing transaction. */
    public function next(): string
    {
        $prefix = 'SLP-'.now()->year.'-';
        $last = $this->slipRepository->lockNumbersStartingWith($prefix)
            ->map(fn (SalarySlip $slip): string => substr((string) $slip->number, strlen($prefix)))
            ->filter(fn (string $suffix): bool => ctype_digit($suffix))
            ->map(fn (string $suffix): int => (int) $suffix)
            ->max() ?? 0;

        return $prefix.str_pad((string) ($last + 1), 4, '0', STR_PAD_LEFT);
    }
}
