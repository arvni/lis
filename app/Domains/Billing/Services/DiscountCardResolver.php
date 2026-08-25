<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\CardValidityDTO;
use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Repositories\DiscountCardRepository;
use App\Domains\Billing\Support\CardNumberTemplate;

/**
 * Turns a scanned or typed card number into a yes/no with a reason. The single
 * place card validity is decided, so nothing downstream can disagree about a card.
 *
 * The number is the whole credential — the barcode carries it and nothing else —
 * so its unguessability comes from the template it was minted with, not from a
 * signature riding alongside it.
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

        // Templated numbers carry a check character, so a mistyped or misread one
        // is caught before the query and told apart from a number that simply is
        // not a card. Legacy numbers have none and fall through to the lookup.
        if ($this->looksTemplated($number) && ! CardNumberTemplate::hasValidCheckCharacter($number)) {
            return CardValidityDTO::invalid('That card number looks mistyped — please check it and try again.');
        }

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

    /**
     * A templated number ends in `-X`: one character after the final separator.
     * Legacy numbers end in a zero-padded serial, which is longer than one.
     */
    private function looksTemplated(string $number): bool
    {
        $split = strrpos($number, '-');

        return $split !== false && $split === strlen($number) - 2;
    }
}
