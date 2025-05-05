<?php

namespace App\Domains\Reception\Exceptions;

class SampleNotFoundException extends \Exception
{
    public function __construct(string $message = "Sample not found", int $code = 404, \Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
