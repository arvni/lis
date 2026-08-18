<?php

declare(strict_types=1);

namespace App\Domains\Reception\Exceptions;

use Exception;
use Throwable;

class AcceptanceNotFinanciallyApprovableException extends Exception
{
    public function __construct(string $message, int $code = 422, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    public static function missingInvoice(int $acceptanceId): self
    {
        return new self(
            "Acceptance #{$acceptanceId} has no invoice; create one, or confirm approving it without an invoice."
        );
    }

    public static function alreadyApproved(int $acceptanceId): self
    {
        return new self(
            "Acceptance #{$acceptanceId} has already been approved financially."
        );
    }
}
