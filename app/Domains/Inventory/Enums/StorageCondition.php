<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum StorageCondition: string
{
    use InteractWithEnum;

    case ROOM_TEMP       = 'ROOM_TEMP';
    case REFRIGERATED    = 'REFRIGERATED';
    case FROZEN          = 'FROZEN';
    case ULTRA_FROZEN    = 'ULTRA_FROZEN';
    case DRY_COOL        = 'DRY_COOL';
    case FLAMMABLE_CABINET = 'FLAMMABLE_CABINET';

    public function label(): string
    {
        return match($this) {
            self::ROOM_TEMP        => 'Room Temperature',
            self::REFRIGERATED     => 'Refrigerated (2–8°C)',
            self::FROZEN           => 'Frozen (-20°C)',
            self::ULTRA_FROZEN     => 'Ultra-frozen (-80°C)',
            self::DRY_COOL         => 'Dry & Cool',
            self::FLAMMABLE_CABINET => 'Flammable Cabinet',
        };
    }
}
