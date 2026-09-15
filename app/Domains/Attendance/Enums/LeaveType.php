<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Enums;

use Kongulov\Traits\InteractWithEnum;

enum LeaveType: string
{
    use InteractWithEnum;

    /** One or more whole days: every working day from the first to the last day. */
    case DAILY = 'DAILY';

    /** Part of one day, between two times. */
    case HOURLY = 'HOURLY';

    public function label(): string
    {
        return match ($this) {
            self::DAILY => 'Full days',
            self::HOURLY => 'Hours',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $type) => ['value' => $type->value, 'label' => $type->label()],
            self::cases(),
        );
    }
}
