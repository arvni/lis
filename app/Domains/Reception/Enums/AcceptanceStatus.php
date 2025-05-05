<?php

namespace App\Domains\Reception\Enums;

use Kongulov\Traits\InteractWithEnum;

enum AcceptanceStatus: string
{
    use InteractWithEnum;

    case PENDING='pending';
    case WAITING_FOR_PAYMENT='waiting for payment';
    case SAMPLING='sampling';
    case WAITING_FOR_ENTERING='waiting for entering';
    case PROCESSING='processing';
    case REPORTED='reported';
    case CANCELLED='Canceled';

}
