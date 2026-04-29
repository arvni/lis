<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ApprovalStatus: string
{
    use InteractWithEnum;

    case PENDING  = 'PENDING';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
}
