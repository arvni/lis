<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum AdjustReason: string
{
    use InteractWithEnum;

    case DAMAGED          = 'DAMAGED';
    case EXPIRED          = 'EXPIRED';
    case COUNT_CORRECTION = 'COUNT_CORRECTION';
    case OTHER            = 'OTHER';
}
