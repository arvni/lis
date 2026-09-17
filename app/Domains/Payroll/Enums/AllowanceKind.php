<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Enums;

use Kongulov\Traits\InteractWithEnum;

enum AllowanceKind: string
{
    use InteractWithEnum;

    /** Added to pay, e.g. a housing or transport allowance. */
    case ALLOWANCE = 'ALLOWANCE';

    /** Taken off pay, e.g. an insurance contribution. */
    case DEDUCTION = 'DEDUCTION';

    public function label(): string
    {
        return match ($this) {
            self::ALLOWANCE => 'Allowance',
            self::DEDUCTION => 'Deduction',
        };
    }

    /**
     * Which way an amount of this kind moves the total: allowances add, deductions take away.
     */
    public function sign(): int
    {
        return $this === self::DEDUCTION ? -1 : 1;
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $kind) => ['value' => $kind->value, 'label' => $kind->label()],
            self::cases(),
        );
    }
}
