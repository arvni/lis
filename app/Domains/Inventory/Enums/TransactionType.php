<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum TransactionType: string
{
    use InteractWithEnum;

    case ENTRY           = 'ENTRY';
    case EXPORT          = 'EXPORT';
    case ADJUST          = 'ADJUST';
    case TRANSFER        = 'TRANSFER';
    case RETURN          = 'RETURN';
    case EXPIRED_REMOVAL = 'EXPIRED_REMOVAL';

    public function referencePrefix(): string
    {
        return match($this) {
            self::ENTRY           => 'ENT',
            self::EXPORT          => 'EXP',
            self::ADJUST          => 'ADJ',
            self::TRANSFER        => 'TRF',
            self::RETURN          => 'RET',
            self::EXPIRED_REMOVAL => 'RMV',
        };
    }
    public function label(): string
    {
        return match($this) {
            self::ENTRY           => 'Entry',
            self::EXPORT          => 'Export',
            self::ADJUST          => 'Adjust',
            self::TRANSFER        => 'Transfer',
            self::RETURN          => 'Return',
            self::EXPIRED_REMOVAL => 'Expired Remove',
        };
    }
}
