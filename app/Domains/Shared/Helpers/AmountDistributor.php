<?php

declare(strict_types=1);

namespace App\Domains\Shared\Helpers;

/**
 * Splits a monetary total across a number of parts without losing (or inventing)
 * money to rounding.
 *
 * A naive `$total / $count` breaks as soon as the total is not divisible by the
 * count: a panel priced 140 over 3 items stores 46.667 three times, which the
 * storage precision then rounds so the parts no longer sum back to 140. The
 * largest-remainder split below works in whole storage units and hands the
 * leftover units to the first parts, so the parts always sum to the exact total.
 */
final class AmountDistributor
{
    /**
     * Decimal places the `acceptance_items.price` / `invoice_items.price`
     * columns keep (whole units).
     */
    public const PRICE_DECIMALS = 0;

    /**
     * Decimal places the `acceptance_items.discount` column keeps.
     */
    public const DISCOUNT_DECIMALS = 3;

    /**
     * Split $total into $parts values that sum back to $total exactly when
     * rounded to $decimals places.
     *
     * @return list<float>
     */
    public static function distribute(float $total, int $parts, int $decimals = self::PRICE_DECIMALS): array
    {
        if ($parts < 1) {
            return [];
        }

        $factor = 10 ** $decimals;
        $totalUnits = (int) round($total * $factor);
        $sign = $totalUnits < 0 ? -1 : 1;
        $absUnits = abs($totalUnits);

        $base = intdiv($absUnits, $parts);
        $remainder = $absUnits % $parts;

        $shares = [];
        for ($index = 0; $index < $parts; $index++) {
            $units = $base + ($index < $remainder ? 1 : 0);
            $shares[] = (float) ($sign * $units / $factor);
        }

        return $shares;
    }
}
