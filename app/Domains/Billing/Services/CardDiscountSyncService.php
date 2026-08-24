<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\Adapters\ReceptionAdapter;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Repositories\DiscountCardRedemptionRepository;
use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Recomputes every card-sourced discount on an acceptance from scratch.
 *
 * Idempotent by design: it strips what it wrote last time and derives the answer
 * again from the card and the items as they are now. That is what lets it run on
 * every item change without any notion of what changed.
 */
class CardDiscountSyncService
{
    /** Marks a discount line as ours, so manual lines are never mistaken for one. */
    public const SOURCE = 'CARD';

    /** Where manual lines are parked while a card overrides them. */
    private const SUPPRESSED_KEY = 'discounts_suppressed_by_card';

    private const DECIMALS = 3;

    public function __construct(
        private readonly ReceptionAdapter $receptionAdapter,
        private readonly DiscountCardResolver $resolver,
        private readonly DiscountCardRedemptionRepository $redemptionRepository,
        private readonly InvoiceComposer $invoiceComposer,
    ) {}

    public function sync(Acceptance $acceptance, ?int $actorId = null): void
    {
        $acceptance->loadMissing('invoice');

        // A paid or statemented invoice is history. Never re-price it.
        if ($acceptance->invoice && $this->invoiceComposer->isLocked($acceptance->invoice)) {
            return;
        }

        DB::transaction(function () use ($acceptance, $actorId): void {
            $card = $this->usableCard($acceptance);
            $items = $this->receptionAdapter->acceptanceItemsForDiscounting($acceptance);
            $quotes = $card ? $this->quote($card, $items) : [];

            $this->writeItems($items, $quotes);
            $this->reconcileLedger($acceptance, $card, $quotes, $actorId);

            if ($acceptance->invoice) {
                $this->invoiceComposer->recompose($acceptance->invoice);
            }
        });
    }

    /**
     * Give back every use this acceptance took, without touching item amounts —
     * used when an acceptance is cancelled or deleted and the discount it consumed
     * should be returned to the card.
     */
    public function revertAll(Acceptance $acceptance, string $reason): void
    {
        DB::transaction(function () use ($acceptance, $reason): void {
            $cardIds = $this->redemptionRepository->cardIdsForAcceptance($acceptance->id);
            $this->redemptionRepository->revertForAcceptance($acceptance->id, $reason);

            foreach ($cardIds as $cardId) {
                DiscountCard::query()
                    ->whereKey($cardId)
                    ->update(['used_count' => $this->redemptionRepository->countUsesForCard((int) $cardId)]);
            }
        });
    }

    /**
     * The attached card, locked for the rest of the transaction, but only if it
     * still passes every validity check. An expired or revoked card simply stops
     * discounting — the acceptance keeps the card on it for the audit trail.
     */
    private function usableCard(Acceptance $acceptance): ?DiscountCard
    {
        if (! $acceptance->discount_card_id) {
            return null;
        }

        /** @var DiscountCard|null $card */
        $card = DiscountCard::query()
            ->whereKey($acceptance->discount_card_id)
            ->lockForUpdate()
            ->first();

        if (! $card) {
            return null;
        }

        $card->load(['partner.offers.tests:id']);

        // Judge the usage limit on the card's other visits only. Its use on this
        // acceptance is the one being recalculated, so counting it would make a
        // single-use card cancel its own discount on the next sync.
        $card->used_count = $this->redemptionRepository->countUsesForCardExcludingAcceptance(
            $card->id,
            $acceptance->id
        );

        return $this->resolver->assess($card)->valid ? $card : null;
    }

    /**
     * What each item is owed, keyed by acceptance item id.
     *
     * @param  Collection<int, AcceptanceItem>  $items
     * @return array<int, array<string, mixed>>
     */
    private function quote(DiscountCard $card, Collection $items): array
    {
        $offers = $card->partner->offers->filter($this->offerIsLive(...));

        if ($offers->isEmpty()) {
            return [];
        }

        $quotes = [];
        $spentPerOffer = [];

        // Ordered so a per-offer cap is consumed by the same items every run.
        foreach ($items->sortBy('id') as $item) {
            $testId = $item->methodTest?->test_id;
            if (! $testId) {
                continue;
            }

            $best = $this->bestOfferFor($offers, (int) $testId, (float) $item->price);
            if (! $best) {
                continue;
            }

            /** @var Offer $offer */
            $offer = $best['offer'];
            $amount = $this->capped($offer, $best['amount'], $spentPerOffer);
            if ($amount <= 0) {
                continue;
            }

            $spentPerOffer[$offer->id] = ($spentPerOffer[$offer->id] ?? 0.0) + $amount;

            $quotes[$item->id] = [
                'offer_id' => $offer->id,
                'card_id' => $card->id,
                'amount' => $amount,
                'type' => $offer->type->name,
                'value' => (float) $offer->amount,
                'title' => $offer->title,
            ];
        }

        return $quotes;
    }

    /**
     * The single best-paying offer for one item. Offers never stack, so the item
     * takes the largest one it qualifies for and ignores the rest.
     *
     * @param  Collection<int, Offer>  $offers
     * @return array{offer: Offer, amount: float}|null
     */
    private function bestOfferFor(Collection $offers, int $testId, float $price): ?array
    {
        $best = null;

        foreach ($offers as $offer) {
            if (! $offer->tests->contains('id', $testId)) {
                continue;
            }

            $amount = $this->amountFor($offer, $price);
            if ($amount <= 0) {
                continue;
            }

            // Ties break on the lower offer id so the choice never flip-flops.
            if ($best === null
                || $amount > $best['amount']
                || ($amount === $best['amount'] && $offer->id < $best['offer']->id)) {
                $best = ['offer' => $offer, 'amount' => $amount];
            }
        }

        return $best;
    }

    private function amountFor(Offer $offer, float $price): float
    {
        $amount = $offer->type === OfferType::PERCENTAGE
            ? $price * ((float) $offer->amount / 100)
            : (float) $offer->amount;

        // A discount can zero an item out but never take it negative.
        return round(min($amount, $price), self::DECIMALS);
    }

    /**
     * @param  array<int, float>  $spentPerOffer
     */
    private function capped(Offer $offer, float $amount, array $spentPerOffer): float
    {
        $cap = $offer->max_amount_per_acceptance;
        if ($cap === null) {
            return $amount;
        }

        $remaining = (float) $cap - ($spentPerOffer[$offer->id] ?? 0.0);

        return round(max(0.0, min($amount, $remaining)), self::DECIMALS);
    }

    private function offerIsLive(Offer $offer): bool
    {
        if (! $offer->active) {
            return false;
        }
        $today = now()->startOfDay();

        return ! ($offer->started_at && $offer->started_at->gt($today))
            && ! ($offer->ended_at && $offer->ended_at->lt($today));
    }

    /**
     * @param  Collection<int, AcceptanceItem>  $items
     * @param  array<int, array<string, mixed>>  $quotes
     */
    private function writeItems(Collection $items, array $quotes): void
    {
        foreach ($items as $item) {
            $parameters = $item->customParameters ?? [];
            $existing = $this->normalizeLines($parameters['discounts'] ?? []);
            $suppressed = $this->normalizeLines($parameters[self::SUPPRESSED_KEY] ?? []);
            $manual = array_values(array_filter(
                $existing,
                static fn (array $line): bool => ($line['source'] ?? null) !== self::SOURCE
            ));

            if (isset($quotes[$item->id])) {
                // The card wins the item outright: manual lines are parked, not lost,
                // so detaching the card puts them back exactly as they were.
                $suppressed = $manual === [] ? $suppressed : $manual;
                $lines = [$this->cardLine($quotes[$item->id])];
            } else {
                $lines = $manual === [] ? $suppressed : $manual;
                $suppressed = [];
            }

            $parameters['discounts'] = $lines;
            if ($suppressed === []) {
                unset($parameters[self::SUPPRESSED_KEY]);
            } else {
                $parameters[self::SUPPRESSED_KEY] = $suppressed;
            }

            $discount = $this->totalFor($lines, (float) $item->price);

            if ($this->unchanged($item, $discount, $parameters)) {
                continue;
            }

            $this->receptionAdapter->writeAcceptanceItemDiscount($item, $discount, $parameters);
        }
    }

    /**
     * @param  array<string, mixed>  $quote
     * @return array<string, mixed>
     */
    private function cardLine(array $quote): array
    {
        return [
            // Stable across syncs so React keys and diffs stay quiet.
            'id' => 'card-'.$quote['card_id'].'-offer-'.$quote['offer_id'],
            'type' => $quote['type'],
            'value' => $quote['value'],
            'amount' => $quote['amount'],
            'reason' => $quote['title'],
            'source' => self::SOURCE,
            'card_id' => $quote['card_id'],
            'offer_id' => $quote['offer_id'],
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $lines
     */
    private function totalFor(array $lines, float $price): float
    {
        $total = 0.0;

        foreach ($lines as $line) {
            // A card line carries the amount the backend already decided; a manual
            // line is still just a type and a value, exactly as reception entered it.
            if (isset($line['amount'])) {
                $total += (float) $line['amount'];

                continue;
            }
            $total += ($line['type'] ?? null) === 'PERCENTAGE'
                ? $price * ((float) ($line['value'] ?? 0) / 100)
                : (float) ($line['value'] ?? 0);
        }

        return round(min($total, $price), self::DECIMALS);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function normalizeLines(mixed $lines): array
    {
        if (! is_array($lines)) {
            return [];
        }

        return array_values(array_filter($lines, 'is_array'));
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    private function unchanged(AcceptanceItem $item, float $discount, array $parameters): bool
    {
        return (float) $item->discount === $discount
            && ($item->customParameters ?? []) == $parameters;
    }

    /**
     * @param  array<int, array<string, mixed>>  $quotes
     */
    private function reconcileLedger(Acceptance $acceptance, ?DiscountCard $card, array $quotes, ?int $actorId): void
    {
        $affectedCardIds = $this->redemptionRepository->cardIdsForAcceptance($acceptance->id);
        $live = $this->redemptionRepository->liveForAcceptance($acceptance->id);
        $keptIds = [];

        foreach ($quotes as $itemId => $quote) {
            $redemption = $this->redemptionRepository->upsertForItem(
                [
                    'discount_card_id' => $quote['card_id'],
                    'acceptance_item_id' => $itemId,
                ],
                [
                    'acceptance_id' => $acceptance->id,
                    'invoice_id' => $acceptance->invoice_id,
                    'offer_id' => $quote['offer_id'],
                    'amount' => $quote['amount'],
                    'applied_by' => $actorId,
                    'applied_at' => now(),
                    'reverted_at' => null,
                    'revert_reason' => null,
                ]
            );
            $keptIds[] = $redemption->id;
        }

        $stale = $live->reject(fn ($redemption) => in_array($redemption->id, $keptIds, true))
            ->pluck('id')
            ->all();
        $this->redemptionRepository->revert($stale, 'Recalculated when the acceptance changed');

        if ($card) {
            $affectedCardIds[] = $card->id;
        }
        foreach (array_unique($affectedCardIds) as $cardId) {
            DiscountCard::query()
                ->whereKey($cardId)
                ->update(['used_count' => $this->redemptionRepository->countUsesForCard((int) $cardId)]);
        }
    }
}
