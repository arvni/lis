<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ItemStatus: string
{
    use InteractWithEnum;

    /** Asked for by the center. */
    case REQUESTED = 'requested';
    /** Added or confirmed by BION. */
    case RECOMMENDED = 'recommended';
    /** Cleared to go to the lab (no finance needed, or the center approved it). */
    case APPROVED = 'approved';
    /** Sent to the lab on an order. */
    case RELEASED = 'released';
    case DROPPED = 'dropped';
}
