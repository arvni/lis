<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

enum FinanceStatus: string
{
    use InteractWithEnum;

    /** Sent; the center's approver has to decide. */
    case AWAITING_CENTER = 'awaiting_center';
    case APPROVED = 'approved';
    /** Some lines approved; BION drops or replaces the rest in review. */
    case PARTIALLY_APPROVED = 'partially_approved';
    case REJECTED = 'rejected';
    /** Not decided within its validity; raises the same exception as a rejection. */
    case EXPIRED = 'expired';
    /** BION pulled it back to change it; a new quotation replaces it. */
    case REVISION_REQUIRED = 'revision_required';

    public function isOpen(): bool
    {
        return $this === self::AWAITING_CENTER;
    }

    public function label(): string
    {
        return match ($this) {
            self::AWAITING_CENTER => 'Awaiting center approval',
            self::APPROVED => 'Approved',
            self::PARTIALLY_APPROVED => 'Partially approved',
            self::REJECTED => 'Rejected',
            self::EXPIRED => 'Expired',
            self::REVISION_REQUIRED => 'Revision required',
        };
    }
}
