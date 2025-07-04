<?php

namespace App\Domains\Billing\Enums;

use Kongulov\Traits\InteractWithEnum;

enum InvoiceStatus: string
{
    use InteractWithEnum;

    case WAITING_FOR_PAYMENT = 'Waiting';
    case PAID = 'Paid';
    case PARTIALLY_PAID = 'Partially Paid';
    case CANCELED = 'Canceled';

    case CREDIT_PAID = 'Credit Paid';

}
