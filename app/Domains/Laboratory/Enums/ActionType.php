<?php

namespace App\Domains\Laboratory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ActionType
{
    use InteractWithEnum;

    case CREATE;
    case UPDATE;
    case DELETE;

}
