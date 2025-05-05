<?php

namespace App\Domains\Laboratory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum OfferType
{
    use InteractWithEnum;
    case PERCENTAGE;
    case FIXED;
}
