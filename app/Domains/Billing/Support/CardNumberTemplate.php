<?php

declare(strict_types=1);

namespace App\Domains\Billing\Support;

use App\Domains\Billing\Exceptions\InvalidCardNumberTemplateException;

/**
 * Compiles the pattern a batch's card numbers are minted from.
 *
 *   D           one digit, 0-9
 *   D{3-7}      one digit drawn from 3..7
 *   L           one capital letter, A-Z
 *   L{A-F}      one capital letter drawn from A..F
 *   '...'       everything inside the quotes is literal
 *   anything    else is literal as typed
 *
 * So `'LAB'-DDDD-DDDD` mints LAB-4820-9153. Quoting matters wherever a literal
 * contains a D or an L, or it would be read as a placeholder.
 *
 * Placeholders are filled at random rather than counted up: the number is the
 * card's only credential now, so a holder must not be able to derive a sibling
 * card from the one in their hand. The batch's shared, recognisable part comes
 * from literals; its contiguous ordering comes from the serial, not the number.
 *
 * A check character is computed per number and stored beside it, but deliberately
 * kept out of the number, the print and the QR — see checkCharacterFor().
 */
final class CardNumberTemplate
{
    /** Value of a character in the check-digit alphabet: 0-9 then A-Z. */
    private const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    private const MAX_LENGTH = 64;

    /**
     * @param  list<array{literal: string}|array{charset: string}>  $tokens
     */
    private function __construct(
        private readonly string $pattern,
        private readonly array $tokens,
    ) {}

    public static function compile(string $pattern): self
    {
        $pattern = trim($pattern);

        if ($pattern === '') {
            throw new InvalidCardNumberTemplateException('The card number template cannot be empty.');
        }
        if (mb_strlen($pattern) > self::MAX_LENGTH) {
            throw new InvalidCardNumberTemplateException('The card number template cannot exceed '.self::MAX_LENGTH.' characters.');
        }

        $tokens = self::tokenize($pattern);

        if (! array_filter($tokens, static fn (array $token): bool => isset($token['charset']))) {
            throw new InvalidCardNumberTemplateException(
                'The template needs at least one D or L placeholder, or every card would get the same number.'
            );
        }

        return new self($pattern, $tokens);
    }

    public function pattern(): string
    {
        return $this->pattern;
    }

    /**
     * How many distinct numbers this template can mint, capped rather than
     * overflowed — a caller only ever compares it against a batch quantity.
     */
    public function capacity(): float
    {
        $capacity = 1.0;

        foreach ($this->tokens as $token) {
            if (isset($token['charset'])) {
                $capacity *= strlen($token['charset']);
            }
            if ($capacity > 1.0e12) {
                return 1.0e12;
            }
        }

        return $capacity;
    }

    /**
     * One card number, exactly the shape of the template — the check character is
     * NOT part of it. Uniqueness is the caller's problem: it holds the batch and
     * knows what it has already minted.
     */
    public function generate(): string
    {
        $number = '';

        foreach ($this->tokens as $token) {
            if (isset($token['literal'])) {
                $number .= $token['literal'];

                continue;
            }
            $charset = $token['charset'];
            $number .= $charset[random_int(0, strlen($charset) - 1)];
        }

        return $number;
    }

    /**
     * The check character for a number, stored alongside it but never printed,
     * never encoded into the QR and never asked for at reception.
     *
     * Because it does not travel with the number, nothing can verify a number
     * against it: a card arrives as its digits alone, so a mistyped one is simply
     * not found. It is kept as a record of what was minted, not as a guard.
     * Restoring typo protection means putting it back into the number itself.
     */
    public static function checkCharacterFor(string $body): string
    {
        return self::checkCharacter($body);
    }

    /**
     * Position-weighted sum over the alphanumerics, mod 36. Weighting the sum is
     * what makes it catch a transposition and not just a substitution.
     */
    private static function checkCharacter(string $body): string
    {
        $sum = 0;
        $position = 0;

        foreach (str_split(strtoupper($body)) as $character) {
            $value = strpos(self::ALPHABET, $character);
            if ($value === false) {
                continue; // separators carry no value
            }
            $position++;
            $sum += $value * $position;
        }

        return self::ALPHABET[$sum % 36];
    }

    /**
     * @return list<array{literal: string}|array{charset: string}>
     */
    private static function tokenize(string $pattern): array
    {
        $tokens = [];
        $characters = str_split($pattern);
        $length = count($characters);

        for ($i = 0; $i < $length; $i++) {
            $character = $characters[$i];

            if ($character === "'") {
                $close = strpos($pattern, "'", $i + 1);
                if ($close === false) {
                    throw new InvalidCardNumberTemplateException('A quoted literal in the template is never closed.');
                }
                $literal = substr($pattern, $i + 1, $close - $i - 1);
                if ($literal !== '') {
                    $tokens[] = ['literal' => $literal];
                }
                $i = $close;

                continue;
            }

            if ($character !== 'D' && $character !== 'L') {
                $tokens[] = ['literal' => $character];

                continue;
            }

            $range = self::readRange($pattern, $i);
            $tokens[] = ['charset' => self::charsetFor($character, $range['from'], $range['to'])];
            $i = $range['end'];
        }

        return $tokens;
    }

    /**
     * Reads an optional `{a-b}` immediately after a placeholder.
     *
     * @return array{from: ?string, to: ?string, end: int}
     */
    private static function readRange(string $pattern, int $index): array
    {
        if (($pattern[$index + 1] ?? '') !== '{') {
            return ['from' => null, 'to' => null, 'end' => $index];
        }

        $close = strpos($pattern, '}', $index + 2);
        if ($close === false) {
            throw new InvalidCardNumberTemplateException('A range in the template is missing its closing brace.');
        }

        $range = substr($pattern, $index + 2, $close - $index - 2);
        if (preg_match('/^(.)-(.)$/', $range, $matches) !== 1) {
            throw new InvalidCardNumberTemplateException(
                'A range must be written as {from-to}, for example D{1-9} or L{A-F}.'
            );
        }

        return ['from' => strtoupper($matches[1]), 'to' => strtoupper($matches[2]), 'end' => $close];
    }

    private static function charsetFor(string $placeholder, ?string $from, ?string $to): string
    {
        $full = $placeholder === 'D' ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        if ($from === null || $to === null) {
            return $full;
        }

        $start = strpos($full, $from);
        $end = strpos($full, $to);

        if ($start === false || $end === false) {
            throw new InvalidCardNumberTemplateException(
                $placeholder === 'D'
                    ? 'A D range may only span digits, for example D{1-9}.'
                    : 'An L range may only span capital letters, for example L{A-F}.'
            );
        }
        if ($start > $end) {
            throw new InvalidCardNumberTemplateException('A range must run low to high, for example D{1-9}, not D{9-1}.');
        }

        return substr($full, $start, $end - $start + 1);
    }
}
