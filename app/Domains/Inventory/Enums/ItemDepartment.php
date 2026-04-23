<?php

namespace App\Domains\Inventory\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ItemDepartment: string
{
    use InteractWithEnum;

    case LAB = 'LAB';
    case ADM = 'ADM';
    case MNT = 'MNT';
    case CLN = 'CLN';
    case IT = 'IT';
    case FAC = 'FAC';

    public function label(): string
    {
        return match($this) {
            self::LAB => 'Laboratory',
            self::ADM => 'Administration',
            self::MNT => 'Maintenance',
            self::CLN => 'Clinical',
            self::IT  => 'IT',
            self::FAC => 'Facility',
        };
    }
}
