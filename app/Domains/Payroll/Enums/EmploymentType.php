<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Enums;

use Kongulov\Traits\InteractWithEnum;

enum EmploymentType: string
{
    use InteractWithEnum;

    case FULL_TIME = 'FULL_TIME';

    case PART_TIME = 'PART_TIME';

    /** A fixed-term position, expected to end on the contract's end date. */
    case TEMPORARY = 'TEMPORARY';

    /** Engaged for work rather than employed, e.g. a visiting consultant. */
    case CONTRACTOR = 'CONTRACTOR';

    public function label(): string
    {
        return match ($this) {
            self::FULL_TIME => 'Full time',
            self::PART_TIME => 'Part time',
            self::TEMPORARY => 'Temporary',
            self::CONTRACTOR => 'Contractor',
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
