<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Repositories;

use App\Domains\PreOrder\Enums\FinanceStatus;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class QuotationRepository
{
    /** @param  array<string, mixed>  $data */
    public function create(PreOrder $preOrder, array $data): PreOrderQuotation
    {
        return $preOrder->quotations()->create($data);
    }

    /** @param  array<string, mixed>  $data */
    public function update(PreOrderQuotation $quotation, array $data): PreOrderQuotation
    {
        $quotation->update($data);

        return $quotation;
    }

    public function count(PreOrder $preOrder): int
    {
        return $preOrder->quotations()->count();
    }

    public function findByNumber(PreOrder $preOrder, string $number): ?PreOrderQuotation
    {
        return $preOrder->quotations()->with('items.test:id,name,code')->where('number', $number)->first();
    }

    /** The quotation for the tests BION confirmed (not an additional-test request) still waiting on the center. */
    public function openMain(PreOrder $preOrder): ?PreOrderQuotation
    {
        return $preOrder->quotations()->whereNull('request_id')->where('status', FinanceStatus::AWAITING_CENTER->value)->latest('id')->first();
    }

    public function openForRequest(PreOrder $preOrder, int $requestId): ?PreOrderQuotation
    {
        return $preOrder->quotations()->where('request_id', $requestId)->where('status', FinanceStatus::AWAITING_CENTER->value)->first();
    }

    /** @return Collection<int, PreOrderQuotation> */
    public function overdue(): Collection
    {
        return PreOrderQuotation::query()
            ->where('status', FinanceStatus::AWAITING_CENTER->value)
            ->where('expires_at', '<', now())
            ->orderBy('id')
            ->get();
    }

    /**
     * The finance desk: every quotation, open ones first.
     *
     * @param  array{status?: string, referrer_id?: int|string, search?: string, pageSize?: int}  $filters
     * @return LengthAwarePaginator<int, PreOrderQuotation>
     */
    public function desk(array $filters): LengthAwarePaginator
    {
        $query = PreOrderQuotation::query()->with(['preOrder:id,code,referrer_id,stage,main_test_id', 'preOrder.referrer:id,fullName', 'preOrder.mainTest:id,name,code', 'request:id,number']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['referrer_id'])) {
            $query->whereHas('preOrder', fn ($q) => $q->where('referrer_id', $filters['referrer_id']));
        }
        if (! empty($filters['search'])) {
            $search = (string) $filters['search'];
            $query->where(fn ($q) => $q->where('number', 'like', "%$search%")
                ->orWhereIn('pre_order_id', PreOrder::query()->search($search)->select('id')));
        }

        return $query
            ->orderByRaw('status = ? desc', [FinanceStatus::AWAITING_CENTER->value])
            ->orderByDesc('id')
            ->paginate($filters['pageSize'] ?? 25);
    }
}
