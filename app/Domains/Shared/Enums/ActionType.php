<?php

namespace App\Domains\Shared\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ActionType
{
    use InteractWithEnum;

    case CREATE;
    case UPDATE;
    case DELETE;
}
