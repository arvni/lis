<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Enums;

use Kongulov\Traits\InteractWithEnum;

enum LeaveApprovalStatus: string
{
    use InteractWithEnum;

    case PENDING = 'PENDING';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';

    /** Never reached: an earlier step rejected the request, or it was cancelled. */
    case SKIPPED = 'SKIPPED';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Waiting',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
            self::SKIPPED => 'Not needed',
        };
    }
}
