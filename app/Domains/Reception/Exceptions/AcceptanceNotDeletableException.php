<?php

declare(strict_types=1);

namespace App\Domains\Reception\Exceptions;

use App\Domains\Reception\Enums\AcceptanceStatus;
use Exception;
use Throwable;

class AcceptanceNotDeletableException extends Exception
{
    public function __construct(AcceptanceStatus $status, int $code = 422, ?Throwable $previous = null)
    {
        parent::__construct(
            'An acceptance that is '.strtolower($status->value).' cannot be deleted; cancel it first.',
            $code,
            $previous
        );
    }
}
