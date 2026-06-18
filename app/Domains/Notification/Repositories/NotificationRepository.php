<?php

namespace App\Domains\Notification\Repositories;

use App\Domains\Notification\Models\Notification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationRepository
{

    /**
     * @param $queryData
     * @return LengthAwarePaginator
     */
    public function listNotifications($queryData): LengthAwarePaginator
    {
        $query = $this->makeQuery($queryData["notifiable"]["type"] ?? null, $queryData["notifiable"]["id"] ?? null);
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);

    }

    /**
     * @param $queryData
     * @return Collection
     */
    public function getUnreadNotifications($queryData): Collection
    {
        $query = $this->makeQuery($queryData["notifiable"]["type"] ?? null, $queryData["notifiable"]["id"] ?? null);
        $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'desc');
        return $query->take($queryData["take"] ?? 10)->get();
    }

    /**
     * Mark the given notifications as read, scoped to the owner.
     *
     * @param array<int, string> $ids
     */
    public function markAsReadForUser(int|string|null $notifiableId, array $ids): void
    {
        if ($notifiableId === null) {
            return;
        }
        $this->makeQuery('user', $notifiableId)
            ->whereIn('id', $ids)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Mark the given notifications as unread, scoped to the owner.
     *
     * @param array<int, string> $ids
     */
    public function markAsUnreadForUser(int|string|null $notifiableId, array $ids): void
    {
        if ($notifiableId === null) {
            return;
        }
        $this->makeQuery('user', $notifiableId)
            ->whereIn('id', $ids)
            ->whereNotNull('read_at')
            ->update(['read_at' => null]);
    }

    /**
     * Mark every unread notification of the owner as read.
     */
    public function markAllAsReadForUser(int|string|null $notifiableId): void
    {
        if ($notifiableId === null) {
            return;
        }
        $this->makeQuery('user', $notifiableId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Delete the given notifications, scoped to the owner.
     *
     * @param array<int, string> $ids
     */
    public function deleteForUser(int|string|null $notifiableId, array $ids): void
    {
        if ($notifiableId === null) {
            return;
        }
        $this->makeQuery('user', $notifiableId)
            ->whereIn('id', $ids)
            ->delete();
    }

    private function makeQuery(string $notifiableType = null, $notifiableId = null): Builder
    {
        $query = Notification::query();
        if ($notifiableType && $notifiableId) {
            $query
                ->where('notifiable_id', $notifiableId)
                ->where('notifiable_type', $notifiableType);
        }
        return $query;
    }

}
