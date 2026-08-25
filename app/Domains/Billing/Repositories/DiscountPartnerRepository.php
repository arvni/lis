<?php

declare(strict_types=1);

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class DiscountPartnerRepository
{
    use LogsUserActivity;

    public function listPartners(array $queryData): LengthAwarePaginator
    {
        $query = DiscountPartner::query()
            ->with(['offers:id,title,type,amount'])
            ->withCount('cards');

        if (isset($queryData['filters'])) {
            $this->applyFilters($query, $queryData['filters']);
        }

        $query->orderBy(
            $queryData['sort']['field'] ?? 'id',
            $queryData['sort']['sort'] ?? 'desc'
        );

        return $query->paginate($queryData['pageSize'] ?? 10);
    }

    /**
     * @return Collection<int, DiscountPartner>
     */
    public function listActiveForSelect(?string $search): Collection
    {
        return DiscountPartner::query()
            ->where('active', true)
            ->when($search, fn (Builder $query) => $query->search(['name', 'contract_no'], $search))
            ->orderBy('name')
            ->limit(25)
            ->get(['id', 'name']);
    }

    /**
     * Whether any partner contract still points at this offer. Used to stop an
     * offer being taken out of contract-only mode while cards still redeem it.
     */
    public function offerIsContracted(int $offerId): bool
    {
        return DiscountPartner::query()
            ->whereHas('offers', fn (Builder $offers) => $offers->where('offers.id', $offerId))
            ->exists();
    }

    public function find(int $id): ?DiscountPartner
    {
        return DiscountPartner::query()->find($id);
    }

    public function createPartner(array $data): DiscountPartner
    {
        $partner = DiscountPartner::query()->make($data);
        $partner->save();
        $this->logCreated($partner);

        return $partner;
    }

    public function updatePartner(DiscountPartner $partner, array $data): DiscountPartner
    {
        $partner->fill($data);
        if ($partner->isDirty()) {
            $partner->save();
            $this->logUpdated($partner);
        }

        return $partner;
    }

    public function deletePartner(DiscountPartner $partner): void
    {
        $partner->delete();
        $this->logDeleted($partner);
    }

    /**
     * @param  Builder<DiscountPartner>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters['search'])) {
            $query->search(['name', 'contract_no'], $filters['search']);
        }
        if (isset($filters['active']) && $filters['active'] !== '') {
            $query->where('active', filter_var($filters['active'], FILTER_VALIDATE_BOOLEAN));
        }
        if (isset($filters['offer_id'])) {
            $query->whereHas('offers', fn (Builder $offers) => $offers->where('offers.id', $filters['offer_id']));
        }
        if (! empty($filters['in_force'])) {
            $today = now()->toDateString();
            $query->where('active', true)
                ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhereDate('starts_at', '<=', $today))
                ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhereDate('ends_at', '>=', $today));
        }
    }
}
