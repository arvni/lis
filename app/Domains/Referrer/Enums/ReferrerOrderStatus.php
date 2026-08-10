<?php

declare(strict_types=1);

namespace App\Domains\Referrer\Enums;

use App\Domains\Reception\Enums\AcceptanceStatus;
use Kongulov\Traits\InteractWithEnum;

/**
 * The statuses a referrer order can carry. These mirror the `status` enum column
 * on `referrer_orders` — keep the two in sync when adding a case.
 */
enum ReferrerOrderStatus: string
{
    use InteractWithEnum;

    case WAITING = 'waiting';
    case PROCESSING = 'processing';
    case WAITING_FOR_FINANCIAL_APPROVAL = 'waiting for financial approval';
    case REPORTED = 'reported';
    case DOWNLOADED = 'downloaded';

    /**
     * Collapse an acceptance status onto the referrer-facing order status.
     *
     * The provider panel only cares about three things: the work is still in
     * flight (processing), it is finished but held back by finance
     * (waiting for financial approval), or the report is out (reported).
     */
    public static function fromAcceptanceStatus(AcceptanceStatus $status): self
    {
        return match ($status) {
            AcceptanceStatus::REPORTED => self::REPORTED,
            AcceptanceStatus::WAITING_FOR_FINANCIAL_APPROVAL => self::WAITING_FOR_FINANCIAL_APPROVAL,
            default => self::PROCESSING,
        };
    }

    /**
     * Statuses that are not terminal, i.e. still worth re-checking against the
     * acceptance they belong to.
     *
     * @return list<string>
     */
    public static function openValues(): array
    {
        return [
            self::WAITING->value,
            self::PROCESSING->value,
            self::WAITING_FOR_FINANCIAL_APPROVAL->value,
        ];
    }
}
