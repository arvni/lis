<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum WorkflowRequestType: string
{
    use InteractWithEnum;

    case PURCHASE = 'PURCHASE';
    case EXPORT = 'EXPORT';

    public function label(): string
    {
        return match ($this) {
            self::PURCHASE => 'Purchase Requests',
            self::EXPORT => 'Export Requests',
        };
    }
}
