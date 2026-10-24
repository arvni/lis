<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

/** What the center's approver chose on a quotation. */
enum FinanceDecision: string
{
    use InteractWithEnum;

    case APPROVE = 'approve';
    /** Keep only the ticked lines. */
    case PARTIAL = 'partial';
    case REJECT = 'reject';
}
