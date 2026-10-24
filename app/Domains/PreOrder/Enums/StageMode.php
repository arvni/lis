<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

/** How a flow uses a library stage. */
enum StageMode: string
{
    use InteractWithEnum;

    case ON = 'on';
    case OFF = 'off';
    /** On only when the stage's rule holds for the pre-order (e.g. BION added tests). */
    case RULE = 'rule';
}
