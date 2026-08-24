<?php

declare(strict_types=1);

namespace App\Domains\Billing\Enums;

use Kongulov\Traits\InteractWithEnum;

/**
 * Lifecycle of a bearer discount card. Redeeming never moves a card between these
 * states — cards are multi-use, and exhaustion is decided by usage_limit/expiry.
 */
enum DiscountCardStatus: string
{
    use InteractWithEnum;

    /** Printed but not yet handed out — cannot be redeemed. */
    case INACTIVE = 'Inactive';

    case ACTIVE = 'Active';

    /** Temporarily parked (suspected abuse, contract under review). Reversible. */
    case SUSPENDED = 'Suspended';

    /** Past its expiry date. Set by the resolver, not stored eagerly. */
    case EXPIRED = 'Expired';

    /** Permanently dead — lost, leaked, or the holder left the company. */
    case REVOKED = 'Revoked';

    public function isRedeemable(): bool
    {
        return $this === self::ACTIVE;
    }

    /** Statuses an operator may set by hand. EXPIRED is date-derived. */
    public static function assignable(): array
    {
        return [self::INACTIVE, self::ACTIVE, self::SUSPENDED, self::REVOKED];
    }
}
