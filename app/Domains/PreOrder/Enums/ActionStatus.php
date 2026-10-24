<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ActionStatus: string
{
    use InteractWithEnum;

    case PENDING = 'pending';
    case DONE = 'done';
    case FAILED = 'failed';
}
