<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ReleasePurpose: string
{
    use InteractWithEnum;

    case PRE_TEST = 'pre';
    case MAIN = 'main';
    case ADD_ON = 'add_on';
    case REPLACEMENT = 'replacement';
}
