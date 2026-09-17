<?php

declare(strict_types=1);

namespace App\Domains\Payroll\DTOs;

use App\Domains\Payroll\Models\SalarySlip;

/**
 * A freshly drafted slip, together with anything about it worth saying out loud.
 *
 * The warnings are not failures — the slip was made either way — but they name the one thing the
 * figures cannot show on their own: a loan whose instalments have fallen behind the calendar,
 * because some earlier month never produced an issued slip.
 */
final readonly class GeneratedSlip
{
    /**
     * @param  list<string>  $warnings
     */
    public function __construct(
        public SalarySlip $slip,
        public array $warnings = [],
    ) {}
}
