<?php

namespace App\Domains\Reception\Enums;

use Kongulov\Traits\InteractWithEnum;

enum AcceptancePriority: string
{
    use InteractWithEnum;

    case ROUTINE = 'routine';
    case URGENT = 'urgent';
    case STAT = 'stat';

    public function label(): string
    {
        return match($this) {
            self::ROUTINE => 'Routine',
            self::URGENT => 'Urgent',
            self::STAT => 'STAT',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::ROUTINE => 'default',
            self::URGENT => 'warning',
            self::STAT => 'error',
        };
    }
}
