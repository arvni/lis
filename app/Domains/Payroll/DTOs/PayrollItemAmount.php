<?php

declare(strict_types=1);

namespace App\Domains\Payroll\DTOs;

/**
 * What one of a person's recurring items is worth in a particular month.
 *
 * The amount is an unsigned magnitude to three decimals; whether it adds or takes away is decided
 * by the catalogue type, so nothing here has to know which way it goes.
 */
final readonly class PayrollItemAmount
{
    public function __construct(
        public string $amount,
        /** How it was worked out, e.g. "instalment 3 of 12 · 2,250.000 remaining". */
        public ?string $note = null,
        /**
         * Which instalment this is, for a loan. Recorded on the slip line so that editing an
         * issued slip can never renumber the loan behind everyone's back.
         */
        public ?int $installmentNumber = null,
    ) {}
}
