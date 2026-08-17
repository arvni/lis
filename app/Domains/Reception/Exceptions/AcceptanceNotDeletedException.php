<?php

declare(strict_types=1);

namespace App\Domains\Reception\Exceptions;

use Exception;
use Throwable;

class AcceptanceNotDeletedException extends Exception
{
    public function __construct(
        string $message = 'This acceptance is not deleted, so there is nothing to restore.',
        int $code = 422,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }
}
