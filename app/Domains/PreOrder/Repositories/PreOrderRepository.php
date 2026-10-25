<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Repositories;

use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Enums\RequestStatus;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderHistory;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Models\PreOrderRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class PreOrderRepository
{
    /** @param  array<string, mixed>  $data */
    public function create(array $data): PreOrder
    {
        // The code is built from the id, so it is unique without a counter table.
        $preOrder = PreOrder::create([...$data, 'code' => 'tmp-'.Str::random(12), 'version' => 1]);
        $preOrder->code = sprintf('PO-%s-%04d', now()->format('y'), $preOrder->id);
        $preOrder->save();

        return $preOrder;
    }

    public function findById(int $id): ?PreOrder
    {
        return PreOrder::query()->find($id);
    }

    /** Re-read the row under a lock, so two actions on one pre-order never interleave. */
    public function lock(PreOrder $preOrder): PreOrder
    {
        return PreOrder::query()->lockForUpdate()->findOrFail($preOrder->id);
    }

    /** @param  array<string, mixed>  $data */
    public function update(PreOrder $preOrder, array $data): PreOrder
    {
        $preOrder->fill($data);
        $preOrder->version = $preOrder->version + 1;
        $preOrder->save();

        return $preOrder;
    }

    /** @param  array<string, mixed>  $data */
    public function addItem(PreOrder $preOrder, array $data): PreOrderItem
    {
        return $preOrder->items()->create($data);
    }

    /** @param  array<string, mixed>  $data */
    public function updateItem(PreOrderItem $item, array $data): PreOrderItem
    {
        $item->update($data);

        return $item;
    }

    /** @param  array<string, mixed>  $data */
    public function addRequest(PreOrder $preOrder, array $data): PreOrderRequest
    {
        $number = (int) $preOrder->requests()->max('number') + 1;

        return $preOrder->requests()->create([...$data, 'number' => $number]);
    }

    /** @param  array<string, mixed>  $data */
    public function updateRequest(PreOrderRequest $request, array $data): PreOrderRequest
    {
        $request->update($data);

        return $request;
    }

    /** @param  array<string, mixed>  $data */
    public function addHistory(PreOrder $preOrder, array $data): PreOrderHistory
    {
        return $preOrder->histories()->create($data);
    }

    /** @return Collection<int, PreOrderItem> */
    public function activeItems(PreOrder $preOrder): Collection
    {
        return $preOrder->items()->with('test')->whereNot('status', 'dropped')->get();
    }

    /** @return Collection<int, PreOrderRequest> */
    public function openRequests(PreOrder $preOrder): Collection
    {
        return $preOrder->requests()->whereIn('status', array_map(fn (RequestStatus $s) => $s->value, array_filter(RequestStatus::cases(), fn (RequestStatus $s) => $s->isOpen())))->orderBy('number')->get();
    }

    /** Everything the detail page and the snapshot show, in one round of queries. */
    public function loadDetail(PreOrder $preOrder): PreOrder
    {
        return $preOrder->load([
            'referrer:id,fullName',
            'assignee:id,name',
            'mainTest:id,name,code',
            'flow:id,name,family',
            'items.test:id,name,code',
            'requests',
            'quotations' => fn ($q) => $q->orderBy('id'),
            'quotations.items.test:id,name,code',
            'histories' => fn ($q) => $q->orderBy('id'),
            'histories.user:id,name',
            'documents',
        ]);
    }

    /**
     * The BION work queue: pre-orders waiting on BION, newest stage first within each group.
     *
     * @param  array{owner?: string, stage?: string, assigned_to?: int|string, unassigned?: bool, search?: string, pageSize?: int}  $filters
     * @return LengthAwarePaginator<int, PreOrder>
     */
    public function queue(array $filters): LengthAwarePaginator
    {
        $query = PreOrder::query()
            ->with(['referrer:id,fullName', 'assignee:id,name', 'mainTest:id,name,code'])
            ->whereNull('closed_at')
            ->whereNot('stage', PreOrderStage::DRAFT->value);

        $owner = $filters['owner'] ?? ActionOwner::BION->value;
        if ($owner !== 'all') {
            $query->where('action_owner', $owner);
        }
        if (! empty($filters['stage'])) {
            $query->where('stage', $filters['stage']);
        }
        if (! empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }
        if (! empty($filters['unassigned'])) {
            $query->whereNull('assigned_to');
        }
        if (! empty($filters['search'])) {
            $query->search((string) $filters['search']);
        }

        return $query->orderBy('stage_entered_at')->paginate($filters['pageSize'] ?? 25);
    }

    /** @return Builder<PreOrder> */
    public function openWithLinkedOrders(): Builder
    {
        return PreOrder::query()->whereNull('closed_at')->whereHas('referrerOrders');
    }
}
