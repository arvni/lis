<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Enums;

use Kongulov\Traits\InteractWithEnum;

enum AttendanceChangeAction: string
{
    use InteractWithEnum;

    /** Check-in/out set by hand. */
    case CORRECTED = 'CORRECTED';

    /** A corrected day handed back to the scheduled job and rebuilt from the punches. */
    case RESET = 'RESET';

    public function label(): string
    {
        return match ($this) {
            self::CORRECTED => 'Times corrected',
            self::RESET => 'Recalculated from punches',
        };
    }
}
