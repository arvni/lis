<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum PurchaseRequestStatus: string
{
    use InteractWithEnum;

    case DRAFT              = 'DRAFT';
    case SUBMITTED          = 'SUBMITTED';
    case APPROVED           = 'APPROVED';
    case ORDERED            = 'ORDERED';
    case PAID               = 'PAID';
    case SHIPPED            = 'SHIPPED';
    case PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED';
    case RECEIVED           = 'RECEIVED';
    case CANCELLED          = 'CANCELLED';
}
