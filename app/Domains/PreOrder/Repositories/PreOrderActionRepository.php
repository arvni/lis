<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Repositories;

use App\Domains\PreOrder\Enums\ActionStatus;
use App\Domains\PreOrder\Models\PreOrderAction;
use Illuminate\Database\Eloquent\Collection;

class PreOrderActionRepository
{
    /**
     * Take a pending action for processing. Returns null when another worker got there first or
     * it was already applied, which is what makes a re-delivered action a no-op.
     */
    public function claim(int $id): ?PreOrderAction
    {
        return PreOrderAction::query()
            ->whereKey($id)
            ->where('status', ActionStatus::PENDING->value)
            ->lockForUpdate()
            ->first();
    }

    public function markDone(PreOrderAction $action, ?int $preOrderId): void
    {
        $action->update([
            'status' => ActionStatus::DONE,
            'pre_order_id' => $preOrderId ?? $action->pre_order_id,
            'error' => null,
            'processed_at' => now(),
        ]);
    }

    public function markFailed(PreOrderAction $action, string $error): void
    {
        $action->update(['status' => ActionStatus::FAILED, 'error' => $error, 'processed_at' => now()]);
    }

    /** @return Collection<int, PreOrderAction> */
    public function pending(int $limit = 100): Collection
    {
        return PreOrderAction::query()->where('status', ActionStatus::PENDING->value)->orderBy('id')->limit($limit)->get();
    }
}
