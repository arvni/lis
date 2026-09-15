<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Enums;

use Kongulov\Traits\InteractWithEnum;

/**
 * Backed by Carbon's dayOfWeek, so `Weekday::from($date->dayOfWeek)` just works.
 * Cases are declared in week order (the week starts on Sunday).
 */
enum Weekday: int
{
    use InteractWithEnum;

    case SUNDAY = 0;
    case MONDAY = 1;
    case TUESDAY = 2;
    case WEDNESDAY = 3;
    case THURSDAY = 4;
    case FRIDAY = 5;
    case SATURDAY = 6;

    public function label(): string
    {
        return ucfirst(strtolower($this->name));
    }

    /**
     * @return list<array{value: int, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $weekday) => ['value' => $weekday->value, 'label' => $weekday->label()],
            self::cases(),
        );
    }
}
