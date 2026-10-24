<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum RequestStatus: string
{
    use InteractWithEnum;

    case OPEN = 'open';
    case ANSWERED = 'answered';
    case CLOSED = 'closed';
    case DECLINED = 'declined';

    public function isOpen(): bool
    {
        return $this === self::OPEN || $this === self::ANSWERED;
    }
}
