<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum TransactionStatus: string
{
    use InteractWithEnum;

    case DRAFT            = 'DRAFT';
    case PENDING_APPROVAL = 'PENDING_APPROVAL';
    case APPROVED         = 'APPROVED';
    case CANCELLED        = 'CANCELLED';
}
