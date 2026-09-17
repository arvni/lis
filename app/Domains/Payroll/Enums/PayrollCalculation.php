<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Enums;

use Kongulov\Traits\InteractWithEnum;

/**
 * How a person's recurring pay item works out its figure for a month.
 */
enum PayrollCalculation: string
{
    use InteractWithEnum;

    /** The same amount every month between the start and end dates. */
    case FIXED = 'FIXED';

    /** A share of the contract's basic salary, every month between the start and end dates. */
    case PERCENTAGE = 'PERCENTAGE';

    /** A total split over a number of months from the start date, e.g. a loan. */
    case INSTALLMENTS = 'INSTALLMENTS';

    public function label(): string
    {
        return match ($this) {
            self::FIXED => 'Fixed amount',
            self::PERCENTAGE => 'Percentage of basic salary',
            self::INSTALLMENTS => 'Instalments',
        };
    }

    /** Instalments end when they are paid off, so an end date would only contradict them. */
    public function usesEndDate(): bool
    {
        return $this !== self::INSTALLMENTS;
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $calculation) => ['value' => $calculation->value, 'label' => $calculation->label()],
            self::cases(),
        );
    }
}
