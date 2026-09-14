<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum WorkflowRequestType: string
{
    use InteractWithEnum;

    case PURCHASE = 'PURCHASE';
    case EXPORT = 'EXPORT';

    /** Staff leave requests (Attendance domain); matched on the requester's roles only. */
    case LEAVE = 'LEAVE';

    public function label(): string
    {
        return match ($this) {
            self::PURCHASE => 'Purchase Requests',
            self::EXPORT => 'Export Requests',
            self::LEAVE => 'Leave Requests',
        };
    }
}
