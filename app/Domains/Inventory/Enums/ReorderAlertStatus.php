<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ReorderAlertStatus: string
{
    use InteractWithEnum;

    case OPEN         = 'OPEN';
    case ACKNOWLEDGED = 'ACKNOWLEDGED';
    case RESOLVED     = 'RESOLVED';
}
