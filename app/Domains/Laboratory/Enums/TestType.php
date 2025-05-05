<?php

namespace App\Domains\Laboratory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum TestType: string
{
    use InteractWithEnum;

    case TEST = "TEST";
    case SERVICE = "SERVICE";
    case PANEL = "PANEL";
}
