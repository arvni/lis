<?php

namespace App\Domains\Reception\Exceptions;


class SampleNotWaitingException extends \Exception
{
    public function __construct(string $message = "Sample is not in waiting status", int $code = 400, \Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
