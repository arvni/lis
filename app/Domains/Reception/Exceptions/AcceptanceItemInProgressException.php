<?php

declare(strict_types=1);

namespace App\Domains\Reception\Exceptions;

use Exception;
use Throwable;

/**
 * Thrown when an item still waiting at, or being worked on in, a lab section is
 * marked reportless. With nothing left to report, the acceptance could finish
 * while the lab is still working on the item.
 */
class AcceptanceItemInProgressException extends Exception
{
    public function __construct(int|string $acceptanceItemId, int $code = 422, ?Throwable $previous = null)
    {
        parent::__construct(
            "Item #{$acceptanceItemId} is still in the lab workflow; finish or reject its section work before marking it reportless.",
            $code,
            $previous
        );
    }
}
