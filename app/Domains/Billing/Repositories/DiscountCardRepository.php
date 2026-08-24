<?php

declare(strict_types=1);

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

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

    public function findByUuid(string $uuid): ?DiscountCard
    {
        return DiscountCard::query()
            ->with(['partner.offers'])
            ->where('uuid', $uuid)
            ->first();
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
    public function insertMany(array $rows): void
    {
        foreach (array_chunk($rows, 500) as $chunk) {
            DiscountCard::query()->insert($chunk);
        }
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
