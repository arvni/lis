<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

/** Who did something on a pre-order: a center user (through the provider panel) or BION staff. */
enum Side: string
{
    use InteractWithEnum;

    case CENTER = 'center';
    case BION = 'bion';
    case SYSTEM = 'system';
}
