<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Enums;

use Kongulov\Traits\InteractWithEnum;

enum AttendanceStatus: string
{
    use InteractWithEnum;

    /** Two or more punches on a working day. */
    case PRESENT = 'PRESENT';

    /** A single punch on a working day: checked in, never checked out. */
    case INCOMPLETE = 'INCOMPLETE';

    /** A working day that ended without any punch. */
    case ABSENT = 'ABSENT';

    /** No hours that weekday, or no shift assigned. */
    case OFF = 'OFF';

    /** The date is on the holiday list. */
    case HOLIDAY = 'HOLIDAY';

    /** Approved leave covers the whole working day. */
    case LEAVE = 'LEAVE';

    public function label(): string
    {
        return match ($this) {
            self::PRESENT => 'Present',
            self::INCOMPLETE => 'Checked in only',
            self::ABSENT => 'Absent',
            self::OFF => 'Day off',
            self::HOLIDAY => 'Holiday',
            self::LEAVE => 'On leave',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $status) => ['value' => $status->value, 'label' => $status->label()],
            self::cases(),
        );
    }
}
