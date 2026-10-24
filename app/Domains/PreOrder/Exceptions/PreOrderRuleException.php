<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Exceptions;

use RuntimeException;

/**
 * A pre-order action that its stage, gate or permissions don't allow. The message is safe to
 * show the center: it goes back to the provider panel on the action result.
 */
class PreOrderRuleException extends RuntimeException {}
