<?php

declare(strict_types=1);

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class DiscountCardRepository
{
    use LogsUserActivity;

    public function listCards(array $queryData): LengthAwarePaginator
    {
        $query = DiscountCard::query()
            ->with(['partner:id,name', 'batch:id,series,printed_at']);

        if (isset($queryData['filters'])) {
            $this->applyFilters($query, $queryData['filters']);
        }

        $query->orderBy(
            $queryData['sort']['field'] ?? 'id',
            $queryData['sort']['sort'] ?? 'desc'
        );

        return $query->paginate($queryData['pageSize'] ?? 10);
    }

    public function findByNumber(string $number): ?DiscountCard
    {
        return DiscountCard::query()
            ->with(['partner.offers'])
            ->where('number', $number)
            ->first();
    }

    /**
     * Bulk insert for a freshly issued batch. Chunked so a 10k-card run does not
     * build one gigantic statement.
     *
     * @param  list<array<string, mixed>>  $rows
     */
    /**
     * Which of these numbers are already taken. Used before minting a run so a
     * random draw never collides with a card that already exists.
     *
     * @param  list<string>  $numbers
     * @return list<string>
     */
    public function existingNumbers(array $numbers): array
    {
        if ($numbers === []) {
            return [];
        }

        return DiscountCard::withTrashed()
            ->whereIn('number', $numbers)
            ->pluck('number')
            ->all();
    }

    public function insertMany(array $rows): void
    {
        foreach (array_chunk($rows, 500) as $chunk) {
            DiscountCard::query()->insert($chunk);
        }
    }

    /**
     * @param  list<int>  $ids
     * @return Collection<int, DiscountCard>
     */
    public function lockByIds(array $ids): Collection
    {
        return DiscountCard::query()->whereIn('id', $ids)->lockForUpdate()->get();
    }

    /**
     * Cards in one batch whose serial falls in the range, locked for the rest of
     * the transaction so two assignments cannot claim the same range at once.
     *
     * @return Collection<int, DiscountCard>
     */
    public function lockBySerialRange(?int $batchId, ?int $from, ?int $to): Collection
    {
        if ($batchId === null || $from === null || $to === null) {
            return new Collection;
        }

        return DiscountCard::query()
            ->where('discount_card_batch_id', $batchId)
            ->whereBetween('serial', [$from, $to])
            ->orderBy('serial')
            ->lockForUpdate()
            ->get();
    }

    /**
     * @param  list<int>  $ids
     * @return int rows moved
     */
    public function assignToPartner(array $ids, ?int $partnerId, ?int $actorId): int
    {
        if ($ids === []) {
            return 0;
        }

        return DiscountCard::query()->whereIn('id', $ids)->update([
            'discount_partner_id' => $partnerId,
            'assigned_at' => $partnerId === null ? null : now(),
            'assigned_by' => $partnerId === null ? null : $actorId,
        ]);
    }

    public function updateCard(DiscountCard $card, array $data): DiscountCard
    {
        $card->fill($data);
        if ($card->isDirty()) {
            $card->save();
            $this->logUpdated($card);
        }

        return $card;
    }

    /**
     * @param  Builder<DiscountCard>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters['search'])) {
            $query->search(['number', 'series', 'uuid'], $filters['search']);
        }
        if (isset($filters['discount_partner_id'])) {
            $query->where('discount_partner_id', $filters['discount_partner_id']);
        }
        if (isset($filters['discount_card_batch_id'])) {
            $query->where('discount_card_batch_id', $filters['discount_card_batch_id']);
        }
        if (isset($filters['series'])) {
            $query->where('series', $filters['series']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['expired'])) {
            $query->whereNotNull('expires_at')->whereDate('expires_at', '<', now()->toDateString());
        }
        if (! empty($filters['redeemable'])) {
            $query->where('status', DiscountCardStatus::ACTIVE)
                ->where(fn (Builder $q) => $q->whereNull('expires_at')->orWhereDate('expires_at', '>=', now()->toDateString()));
        }
    }
}
