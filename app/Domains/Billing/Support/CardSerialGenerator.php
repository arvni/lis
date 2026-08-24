<?php

declare(strict_types=1);

namespace App\Domains\Billing\Support;

use Illuminate\Support\Str;

/**
 * Builds the human-readable identifiers printed under the QR. These are a
 * convenience for manual entry, never a credential — the uuid is the credential.
 */
final class CardSerialGenerator
{
    private const SERIAL_PAD = 5;

    /**
     * e.g. "ACME-202608-K3QZ". Random tail keeps two batches for the same partner
     * in the same month from colliding; the caller re-rolls on a unique clash.
     */
    public function generateSeries(?string $prefix): string
    {
        $head = Str::upper(Str::slug($prefix ?: 'CARD'));

        return sprintf('%s-%s-%s', $head, now()->format('Ym'), Str::upper(Str::random(4)));
    }

    public function numberFor(string $series, int $serial): string
    {
        return sprintf('%s-%s', $series, str_pad((string) $serial, self::SERIAL_PAD, '0', STR_PAD_LEFT));
    }
}
