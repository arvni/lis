<?php

declare(strict_types=1);

namespace App\Domains\Shared\Helpers;

/**
 * SQL fragments for the money columns, so every report spells them the same way.
 */
final class MoneySql
{
    /** Decimal places the money columns keep. */
    private const SCALE = 3;

    /**
     * What an item is actually worth: its price less its discount, never below zero.
     *
     * `acceptance_items.price` is UNSIGNED BIGINT and `.discount` UNSIGNED DECIMAL,
     * so a plain `price - discount` does not go negative in MySQL — it aborts the
     * whole statement with "1690 DECIMAL UNSIGNED value is out of range". One item
     * carrying a discount above its price was enough to 500 the dashboard. Casting
     * to a signed decimal makes the subtraction well defined and GREATEST keeps a
     * defective row from reading as negative income.
     *
     * @param  string  $table  table name or alias the columns are qualified with
     */
    public static function net(string $table): string
    {
        return sprintf(
            'GREATEST(CAST(%1$s.price AS DECIMAL(20, %2$d)) - CAST(%1$s.discount AS DECIMAL(20, %2$d)), 0)',
            $table,
            self::SCALE
        );
    }
}
