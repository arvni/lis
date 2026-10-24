<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum StartMode: string
{
    use InteractWithEnum;

    /** The center picked tests from the enabled list. */
    case TESTS = 'tests';
    /** The center described the case and left the choice of tests to BION. */
    case DESCRIBE = 'describe';
}
