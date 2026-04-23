<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum LotStatus: string
{
    use InteractWithEnum;

    case ACTIVE     = 'ACTIVE';
    case EXPIRED    = 'EXPIRED';
    case QUARANTINE = 'QUARANTINE';
    case CONSUMED   = 'CONSUMED';
}
