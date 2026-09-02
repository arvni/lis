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

    /**
     * Split $total into shares that sum back to $total exactly, where no share
     * may exceed its matching cap.
     *
     * This is how a panel discount is spread over the panel's items: prices are
     * stored in whole units while discounts keep thousandths, so splitting the
     * two independently can hand an item a 3.334 discount on a 3 price. That row
     * then makes MySQL abort any `price - discount` aggregate with
     * "1690 DECIMAL UNSIGNED value is out of range", because both columns are
     * unsigned. Capping each share at its own price keeps the two splits
     * consistent with each other.
     *
     * A total larger than the caps allow is truncated to their sum, and a
     * negative total yields zeros — a discount can zero an item out but never
     * take it negative.
     *
     * @param  list<float>  $caps  the ceiling for each share, in the same order
     * @return list<float>
     */
    public static function distributeCapped(float $total, array $caps, int $decimals = self::DISCOUNT_DECIMALS): array
    {
        $parts = count($caps);

        if ($parts < 1) {
            return [];
        }

        $factor = 10 ** $decimals;
        $capUnits = array_map(
            static fn ($cap): int => max(0, (int) round((float) $cap * $factor)),
            array_values($caps)
        );
        $remaining = min(max(0, (int) round($total * $factor)), array_sum($capUnits));

        $shares = array_fill(0, $parts, 0);

        // Fill evenly, round after round, skipping whatever has hit its cap. The
        // leftover units that no longer divide go one apiece to the earliest
        // shares with room, the same largest-remainder bias distribute() uses.
        while ($remaining > 0) {
            $open = [];
            for ($index = 0; $index < $parts; $index++) {
                if ($shares[$index] < $capUnits[$index]) {
                    $open[] = $index;
                }
            }

            if ($open === []) {
                break;
            }

            $each = intdiv($remaining, count($open));

            if ($each === 0) {
                foreach ($open as $index) {
                    if ($remaining === 0) {
                        break;
                    }
                    $shares[$index]++;
                    $remaining--;
                }

                break;
            }

            foreach ($open as $index) {
                $give = min($each, $capUnits[$index] - $shares[$index]);
                $shares[$index] += $give;
                $remaining -= $give;
            }
        }

        return array_map(static fn (int $units): float => $units / $factor, $shares);
    }
}
