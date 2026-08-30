<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\CardValidityDTO;
use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Repositories\DiscountCardRepository;

/**
 * Turns a scanned or typed card number into a yes/no with a reason. The single
 * place card validity is decided, so nothing downstream can disagree about a card.
 *
 * The number is the whole credential — the barcode carries it and nothing else —
 * so its unguessability comes from the template it was minted with, not from a
 * signature riding alongside it. The stored check character is deliberately not
 * consulted here: it is not printed or encoded, so a scan never carries one.
 */
class DiscountCardResolver
{
    public function __construct(
        private readonly DiscountCardRepository $cardRepository,
    ) {}

    /**
     * The barcode scans to the number and a receptionist types the same thing, so
     * both land here with nothing to tell them apart.
     */
    public function resolve(string $code): CardValidityDTO
    {
        $number = strtoupper(trim($code));

        // The check character is stored but never travels with the number, so a
        // mistyped card is indistinguishable from one that does not exist. Both
        // land on "not recognised" below.
        $card = $this->cardRepository->findByNumber($number);

        if (! $card) {
            return CardValidityDTO::invalid('This card is not recognised.');
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

        if ($card->isUnassigned()) {
            return CardValidityDTO::invalid('This card has not been assigned to a partner yet.', $card);
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
}
