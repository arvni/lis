<?php

namespace App\Domains\Billing\Enums;

use Kongulov\Traits\InteractWithEnum;

enum InvoiceItemKind: string
{
    use InteractWithEnum;

    case TEST = 'test';
    case PANEL = 'panel';
    case MANUAL_FEE = 'manual_fee';
    case ADJUSTMENT = 'adjustment';
}
