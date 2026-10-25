<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum RequestStatus: string
{
    use InteractWithEnum;

    case OPEN = 'open';
    case ANSWERED = 'answered';
    /** An additional-test request whose quotation is with the center. */
    case AWAITING_FINANCE = 'awaiting_finance';
    /** Its tests were released on an add-on order; closes when the order arrives. */
    case ORDER_CREATED = 'order_created';
    case CLOSED = 'closed';
    case DECLINED = 'declined';

    public function isOpen(): bool
    {
        return in_array($this, [self::OPEN, self::ANSWERED, self::AWAITING_FINANCE, self::ORDER_CREATED], true);
    }
}
