<?php

declare(strict_types=1);

namespace App\Domains\Billing\Support;

use App\Domains\Billing\Models\DiscountCard;

/**
 * Signs the QR payload so a fabricated card fails before it ever reaches the database.
 *
 * The signature is not a secret the holder must protect — the uuid already is — it only
 * stops someone generating plausible-looking cards from a guessed uuid space offline.
 */
final class CardQrSigner
{
    private const SIGNATURE_LENGTH = 10;

    private const DOMAIN = 'discount-card:';

    public function sign(string $uuid): string
    {
        return substr(hash_hmac('sha256', self::DOMAIN.$uuid, $this->key()), 0, self::SIGNATURE_LENGTH);
    }

    public function verify(string $uuid, ?string $signature): bool
    {
        if ($signature === null || $signature === '') {
            return false;
        }

        return hash_equals($this->sign($uuid), $signature);
    }

    /**
     * The URL encoded into the card's QR code.
     */
    public function urlFor(DiscountCard $card): string
    {
        return route('discount-cards.verify', [
            'uuid' => $card->uuid,
            's' => $this->sign($card->uuid),
        ]);
    }

    private function key(): string
    {
        $key = (string) config('app.key');

        if (str_starts_with($key, 'base64:')) {
            $key = (string) base64_decode(substr($key, 7), true);
        }

        return $key;
    }
}
