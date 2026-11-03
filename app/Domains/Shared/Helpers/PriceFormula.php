<?php

declare(strict_types=1);

namespace App\Domains\Shared\Helpers;

/**
 * Works out one price setting (a fixed price, a formula, or conditions) for the values reception
 * or BION enters, such as the number of embryos. Acceptances and pre-orders price with it, so a
 * quotation always matches what reception would charge.
 *
 * A setting's `extra` holds `parameters` ([{value: 'noEmbryos'}, ...]) and either `formula`
 * ('190*noEmbryos') or `conditions` ([{condition: 'noEmbryos<=2', value: '360'}, ...]).
 */
final class PriceFormula
{
    /**
     * FIX → the static price; FORMULATE → the formula; CONDITIONAL → the first matching condition's value.
     *
     * @param  array<string, mixed>  $extra
     * @param  array<string, mixed>  $values  parameter name => value
     */
    public static function resolve(mixed $priceType, mixed $staticPrice, array $extra, array $values): float
    {
        // The Laboratory MethodPriceType values, compared as stored so any domain can use this.
        $type = $priceType instanceof \BackedEnum ? (string) $priceType->value : (string) $priceType;

        return match ($type) {
            'Formulate' => self::formula((string) ($extra['formula'] ?? ''), (array) ($extra['parameters'] ?? []), $values),
            'Conditional' => self::conditional((array) ($extra['conditions'] ?? []), (array) ($extra['parameters'] ?? []), $values),
            default => (float) $staticPrice,
        };
    }

    /**
     * The names of the values a setting needs, e.g. ['noEmbryos'].
     *
     * @param  array<string, mixed>  $extra
     * @return list<string>
     */
    public static function parameters(array $extra): array
    {
        $names = [];
        foreach ((array) ($extra['parameters'] ?? []) as $param) {
            $name = is_array($param) ? (string) ($param['value'] ?? '') : '';
            if ($name !== '') {
                $names[] = $name;
            }
        }

        return array_values(array_unique($names));
    }

    /**
     * @param  array<int, mixed>  $paramSchema
     * @param  array<string, mixed>  $values
     */
    private static function formula(string $formula, array $paramSchema, array $values): float
    {
        if (blank($formula)) {
            return 0.0;
        }

        $expression = self::substitute($formula, $paramSchema, $values);

        if (! self::isSafeExpression($expression)) {
            return 0.0;
        }

        try {
            $result = eval("return (float)({$expression});");

            return is_numeric($result) ? (float) $result : 0.0;
        } catch (\Throwable) {
            return 0.0;
        }
    }

    /**
     * @param  array<int, mixed>  $conditions
     * @param  array<int, mixed>  $paramSchema
     * @param  array<string, mixed>  $values
     */
    private static function conditional(array $conditions, array $paramSchema, array $values): float
    {
        foreach ($conditions as $condition) {
            if (! is_array($condition)) {
                continue;
            }
            $condExpr = self::substitute((string) ($condition['condition'] ?? ''), $paramSchema, $values);
            $valueExpr = self::substitute((string) ($condition['value'] ?? ''), $paramSchema, $values);

            if (! self::isSafeCondition($condExpr) || ! self::isSafeExpression($valueExpr)) {
                continue;
            }

            try {
                $matches = eval("return (bool)({$condExpr});");
                if ($matches) {
                    $result = eval("return (float)({$valueExpr});");

                    return is_numeric($result) ? (float) $result : 0.0;
                }
            } catch (\Throwable) {
                continue;
            }
        }

        return 0.0;
    }

    /**
     * Replace each parameter name with its numeric value, longest names first so a short name
     * never replaces part of a longer one.
     *
     * @param  array<int, mixed>  $paramSchema
     * @param  array<string, mixed>  $values
     */
    private static function substitute(string $expression, array $paramSchema, array $values): string
    {
        $names = [];
        foreach ($paramSchema as $param) {
            $name = is_array($param) ? (string) ($param['value'] ?? '') : '';
            if ($name !== '') {
                $names[] = $name;
            }
        }
        usort($names, fn (string $a, string $b): int => strlen($b) - strlen($a));

        foreach ($names as $name) {
            $value = (float) ($values[$name] ?? 0);
            $expression = (string) preg_replace('/\b'.preg_quote($name, '/').'\b/', (string) $value, $expression);
        }

        return trim($expression);
    }

    /** Only numeric math: no function calls, no strings. */
    private static function isSafeExpression(string $expr): bool
    {
        return (bool) preg_match('/^[\d\s+\-*\/().]+$/', $expr);
    }

    /** Numbers, arithmetic, comparisons (< > <= >= == !=) and && ||. */
    private static function isSafeCondition(string $expr): bool
    {
        return (bool) preg_match('/^[\d\s+\-*\/().&|<>=!]+$/', $expr);
    }
}
