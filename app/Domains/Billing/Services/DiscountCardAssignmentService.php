<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\AssignCardsDTO;
use App\Domains\Billing\Exceptions\CardsNotAssignableException;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Repositories\DiscountCardRepository;
use App\Domains\Billing\Repositories\DiscountPartnerRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Hands stock cards to a partner — a whole serial range at a time, or a few
 * numbers picked off individually.
 *
 * Assignment is what gives a card its discount: until a partner is behind it, the
 * resolver refuses it. So this is a money-moving operation and it is deliberately
 * strict about what it will touch.
 */
class DiscountCardAssignmentService
{
    public function __construct(
        private readonly DiscountCardRepository $cardRepository,
        private readonly DiscountPartnerRepository $partnerRepository,
    ) {}

    /**
     * @return int the number of cards moved
     */
    public function assign(AssignCardsDTO $dto, ?int $actorId): int
    {
        return DB::transaction(function () use ($dto, $actorId): int {
            $cards = $this->lockCards($dto);

            if ($cards->isEmpty()) {
                throw new CardsNotAssignableException('No cards matched that selection.');
            }

            $this->guardAgainstRedeemedCards($cards);
            $this->guardAgainstOtherPartners($cards, $dto->discount_partner_id);

            return $this->cardRepository->assignToPartner(
                $cards->pluck('id')->all(),
                $dto->discount_partner_id,
                $actorId
            );
        });
    }

    /**
     * Returns cards to stock. The discount stops immediately — every acceptance
     * still holding one re-syncs to nothing on its next change.
     *
     * @return int the number of cards released
     */
    public function release(AssignCardsDTO $dto, ?int $actorId): int
    {
        return DB::transaction(function () use ($dto): int {
            $cards = $this->lockCards($dto);

            if ($cards->isEmpty()) {
                throw new CardsNotAssignableException('No cards matched that selection.');
            }

            $this->guardAgainstRedeemedCards($cards);

            return $this->cardRepository->assignToPartner($cards->pluck('id')->all(), null, null);
        });
    }

    /**
     * @return Collection<int, DiscountCard>
     */
    private function lockCards(AssignCardsDTO $dto): Collection
    {
        if ($dto->card_ids !== []) {
            return $this->cardRepository->lockByIds($dto->card_ids);
        }

        return $this->cardRepository->lockBySerialRange(
            $dto->discount_card_batch_id,
            $dto->serial_from,
            $dto->serial_to
        );
    }

    /**
     * A card that has already discounted something cannot change hands: its
     * redemptions are reported under the partner it belonged to at the time, and
     * moving it would split one card's history across two contracts.
     *
     * @param  Collection<int, DiscountCard>  $cards
     */
    private function guardAgainstRedeemedCards(Collection $cards): void
    {
        $redeemed = $cards->filter(fn (DiscountCard $card): bool => $card->used_count > 0);

        if ($redeemed->isNotEmpty()) {
            throw new CardsNotAssignableException(sprintf(
                '%d of the selected cards have already been used (%s%s). A card that has discounted something cannot change partner.',
                $redeemed->count(),
                $redeemed->take(3)->pluck('number')->implode(', '),
                $redeemed->count() > 3 ? '…' : ''
            ));
        }
    }

    /**
     * Taking a card straight from one partner to another silently re-points a card
     * that may already be in someone's wallet. Release it to stock first, which is
     * an explicit, logged step.
     *
     * @param  Collection<int, DiscountCard>  $cards
     */
    private function guardAgainstOtherPartners(Collection $cards, int $partnerId): void
    {
        if (! $this->partnerRepository->find($partnerId)) {
            throw new CardsNotAssignableException('That partner no longer exists.');
        }

        $held = $cards->filter(
            fn (DiscountCard $card): bool => $card->discount_partner_id !== null
                && $card->discount_partner_id !== $partnerId
        );

        if ($held->isNotEmpty()) {
            throw new CardsNotAssignableException(sprintf(
                '%d of the selected cards already belong to another partner (%s%s). Release them back to stock first.',
                $held->count(),
                $held->take(3)->pluck('number')->implode(', '),
                $held->count() > 3 ? '…' : ''
            ));
        }
    }
}
