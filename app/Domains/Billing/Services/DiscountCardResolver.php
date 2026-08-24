<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\CardValidityDTO;
use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Repositories\DiscountCardRepository;
use App\Domains\Billing\Support\CardQrSigner;

/**
 * Turns a scanned code into a yes/no with a reason. The single place card validity
 * is decided, so the public page and reception can never disagree about a card.
 */
class DiscountCardResolver
{
    public function __construct(
        private readonly DiscountCardRepository $cardRepository,
        private readonly CardQrSigner $signer,
    ) {}

    /**
     * Scanners hand us the whole QR URL; receptionists type the printed number.
     * Both land here.
     */
    public function resolve(string $code, ?string $signature = null): CardValidityDTO
    {
        $uuid = $this->extractUuid($code);

        $card = $uuid
            ? $this->cardRepository->findByUuid($uuid)
            : $this->cardRepository->findByNumber(trim($code));

        if (! $card) {
            return CardValidityDTO::invalid('This card is not recognised.');
        }

        // Only enforced for QR scans: a typed card number never carries a signature.
        if ($uuid && $signature !== null && ! $this->signer->verify($uuid, $signature)) {
            return CardValidityDTO::invalid('This card code could not be verified.');
        }

        return $this->assess($card);
    }

    public function assess(DiscountCard $card): CardValidityDTO
    {
        if ($card->status === DiscountCardStatus::REVOKED) {
            return CardValidityDTO::invalid('This card has been revoked.', $card);
        }
        if ($card->status === DiscountCardStatus::SUSPENDED) {
            return CardValidityDTO::invalid('This card is currently suspended.', $card);
        }
        if ($card->status === DiscountCardStatus::INACTIVE) {
            return CardValidityDTO::invalid('This card has not been activated yet.', $card);
        }
        if ($card->isExpired()) {
            return CardValidityDTO::invalid('This card expired on '.$card->expires_at?->format('Y-m-d').'.', $card);
        }
        if ($card->hasReachedUsageLimit()) {
            return CardValidityDTO::invalid('This card has reached its usage limit.', $card);
        }

        $partner = $card->partner;
        if (! $partner || ! $partner->isInForce()) {
            return CardValidityDTO::invalid('The contract behind this card is not currently in force.', $card);
        }
        if ($partner->offers->isEmpty()) {
            return CardValidityDTO::invalid('No discount is configured for this contract.', $card);
        }

        return CardValidityDTO::valid($card);
    }

    /**
     * Accepts a bare uuid or the full QR URL a scanner types in.
     */
    private function extractUuid(string $code): ?string
    {
        if (preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i', $code, $matches) === 1) {
            return strtolower($matches[0]);
        }

        return null;
    }
}
