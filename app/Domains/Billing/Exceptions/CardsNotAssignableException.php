<?php

declare(strict_types=1);

namespace App\Domains\Billing\Exceptions;

use RuntimeException;

/**
 * The selected cards cannot change hands. Its message names which cards and why,
 * and is shown to whoever attempted the assignment.
 */
class CardsNotAssignableException extends RuntimeException {}
