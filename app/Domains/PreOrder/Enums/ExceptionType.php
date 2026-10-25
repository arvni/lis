<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

/** Exceptions sit on top of the stage; clearing one returns the pre-order to the same stage. */
enum ExceptionType: string
{
    use InteractWithEnum;

    case HOLD_CENTER = 'hold_center';
    case HOLD_BION = 'hold_bion';
    /** The center rejected the quotation, or it expired. BION sends a new one or cancels. */
    case FINANCE_REJECTED = 'finance_rejected';
    /** One batch's samples can't be used. The center clears it by sending a replacement batch. */
    case SAMPLE_ISSUE = 'sample_issue';
    case NOT_ELIGIBLE = 'not_eligible';
    case NOT_PROCEEDING = 'not_proceeding';
    case CANCELLED = 'cancelled';

    /** Final exceptions close the pre-order; holds can be resumed. */
    public function isFinal(): bool
    {
        return in_array($this, [self::NOT_ELIGIBLE, self::NOT_PROCEEDING, self::CANCELLED], true);
    }
}
