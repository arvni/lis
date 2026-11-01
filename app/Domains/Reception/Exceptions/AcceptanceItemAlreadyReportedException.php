<?php

declare(strict_types=1);

namespace App\Domains\Reception\Exceptions;

use Exception;
use Throwable;

/** Thrown when an item that already has a report is marked reportless. */
class AcceptanceItemAlreadyReportedException extends Exception
{
    public function __construct(int|string $acceptanceItemId, int $code = 422, ?Throwable $previous = null)
    {
        parent::__construct(
            "Item #{$acceptanceItemId} already has a report, so it can't be marked reportless.",
            $code,
            $previous
        );
    }
}
