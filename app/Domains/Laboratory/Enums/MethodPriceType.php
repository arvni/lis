<?php

namespace App\Domains\Laboratory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum MethodPriceType: string
{
    use InteractWithEnum;

    case FIX = "Fix";
    case FORMULATE = "Formulate";
    case CONDITIONAL="Conditional";

}
