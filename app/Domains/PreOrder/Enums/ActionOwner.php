<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ActionOwner: string
{
    use InteractWithEnum;

    case CENTER = 'center';
    case BION = 'bion';
    case NONE = 'none';
}
