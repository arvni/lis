<?php

namespace App\Domains\QC\Enums;

enum QCLevel: string
{
    case LOW    = 'low';
    case NORMAL = 'normal';
    case HIGH   = 'high';

    public function label(): string
    {
        return match($this) {
            self::LOW    => 'Level 1 – Low',
            self::NORMAL => 'Level 2 – Normal',
            self::HIGH   => 'Level 3 – High',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::LOW    => 'info',
            self::NORMAL => 'success',
            self::HIGH   => 'warning',
        };
    }
}
