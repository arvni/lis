<?php

declare(strict_types=1);

namespace App\Domains\Reception\Exceptions;

use Exception;
use Throwable;

/**
 * Thrown when an edit tries to move an acceptance item onto a different test
 * after the item has already started its life in the lab. Swapping the test
 * then would silently invalidate the sample, the workflow states or the report
 * hanging off the item.
 */
class AcceptanceItemTestNotChangeableException extends Exception
{
    public function __construct(int|string $acceptanceItemId, int $code = 422, ?Throwable $previous = null)
    {
        parent::__construct(
            "Item #{$acceptanceItemId} has already been sampled, entered or reported; its test can no longer be changed.",
            $code,
            $previous
        );
    }
}
