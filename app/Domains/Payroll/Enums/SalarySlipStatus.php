<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Enums;

use Kongulov\Traits\InteractWithEnum;

enum SalarySlipStatus: string
{
    use InteractWithEnum;

    /** Being prepared. The employee cannot see it. */
    case DRAFT = 'DRAFT';

    /** Given to the employee, who can now see it. */
    case ISSUED = 'ISSUED';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::ISSUED => 'Issued',
        };
    }

    /** Whether the person the slip belongs to is allowed to see it. */
    public function isVisibleToEmployee(): bool
    {
        return $this === self::ISSUED;
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
