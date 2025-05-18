<?php

namespace App\Domains\Billing\Enums;

use Kongulov\Traits\InteractWithEnum;

enum PaymentMethod: string
{
    use InteractWithEnum;

    case CARD = 'card';
    case CASH = 'cash';
    case CREDIT = 'credit';
    case TRANSFER = 'transfer';

}
