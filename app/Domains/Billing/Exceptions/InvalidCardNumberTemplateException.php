<?php

declare(strict_types=1);

namespace App\Domains\Billing\Exceptions;

use InvalidArgumentException;

/**
 * The card number template could not be compiled. Its message is written to be
 * shown to whoever typed the template, so it always names the fix.
 */
class InvalidCardNumberTemplateException extends InvalidArgumentException {}
