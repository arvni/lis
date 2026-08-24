<?php

declare(strict_types=1);

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Models\DiscountCardRedemption;
use Illuminate\Database\Eloquent\Collection;

class DiscountCardRedemptionRepository
{
    /**
     * Live (un-reverted) redemptions recorded against an acceptance.
     *
     * @return Collection<int, DiscountCardRedemption>
     */
    public function liveForAcceptance(int $acceptanceId): Collection
    {
        return DiscountCardRedemption::query()
            ->where('acceptance_id', $acceptanceId)
            ->whereNull('reverted_at')
            ->get();
    }

    public function upsertForItem(array $keys, array $values): DiscountCardRedemption
    {
        /** @var DiscountCardRedemption $redemption */
        $redemption = DiscountCardRedemption::query()->updateOrCreate($keys, $values);

        return $redemption;
    }

    /**
     * Tombstone rather than delete: a discount that was given and then taken back
     * is history worth keeping.
     *
     * @param  list<int>  $ids
     */
    public function revert(array $ids, string $reason): void
    {
        if ($ids === []) {
            return;
        }

        DiscountCardRedemption::query()
            ->whereIn('id', $ids)
            ->whereNull('reverted_at')
            ->update(['reverted_at' => now(), 'revert_reason' => $reason]);
    }

    public function revertForAcceptance(int $acceptanceId, string $reason): void
    {
        DiscountCardRedemption::query()
            ->where('acceptance_id', $acceptanceId)
            ->whereNull('reverted_at')
            ->update(['reverted_at' => now(), 'revert_reason' => $reason]);
    }

    /**
     * How many separate visits a card has been used on. One acceptance counts once
     * however many of its tests the card discounted.
     */
    public function countUsesForCard(int $cardId): int
    {
        return DiscountCardRedemption::query()
            ->where('discount_card_id', $cardId)
            ->whereNull('reverted_at')
            ->distinct()
            ->count('acceptance_id');
    }

    /**
     * Uses on every visit except this one — what the usage limit must be judged
     * against while recalculating this visit, or a card would count its own use
     * against itself on the second pass.
     */
    public function countUsesForCardExcludingAcceptance(int $cardId, int $acceptanceId): int
    {
        return DiscountCardRedemption::query()
            ->where('discount_card_id', $cardId)
            ->where('acceptance_id', '!=', $acceptanceId)
            ->whereNull('reverted_at')
            ->distinct()
            ->count('acceptance_id');
    }

    /**
     * @return list<int>
     */
    public function cardIdsForAcceptance(int $acceptanceId): array
    {
        return DiscountCardRedemption::query()
            ->where('acceptance_id', $acceptanceId)
            ->distinct()
            ->pluck('discount_card_id')
            ->all();
    }
}
