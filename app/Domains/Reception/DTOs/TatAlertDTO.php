<?php

declare(strict_types=1);

namespace App\Domains\Reception\DTOs;

/**
 * One reminder: an acceptance whose items under a rule's tests are running out of TAT.
 */
readonly class TatAlertDTO
{
    /**
     * @param  list<string>  $testNames
     * @param  int  $daysLeft  working days left on the most urgent item; 0 = due today, negative = overdue
     * @param  string  $deadline  earliest item deadline (Y-m-d)
     */
    public function __construct(
        public int $acceptanceId,
        public ?string $referenceCode,
        public ?string $patientName,
        public array $testNames,
        public int $daysLeft,
        public string $deadline,
        public string $ruleName,
    ) {}
}
