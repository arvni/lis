<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum StockExportRequestStatus: string
{
    use InteractWithEnum;

    case DRAFT = 'DRAFT';
    case SUBMITTED = 'SUBMITTED';
    case APPROVED = 'APPROVED';
    case PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED';
    case FULFILLED = 'FULFILLED';
    case CANCELLED = 'CANCELLED';
}
