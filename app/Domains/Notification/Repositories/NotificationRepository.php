<?php

declare(strict_types=1);

namespace App\Domains\Notification\Repositories;

use App\Domains\Notification\Models\Notification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationRepository
{
    /**
     * Columns a client is allowed to sort by. Anything else falls back to the
     * default — the sort field reaches orderBy() raw, so it must be a whitelist.
     */
    private const SORTABLE = ['created_at', 'read_at', 'type'];

    /**
     * @param  array<string, mixed>  $queryData
     */
    public function listNotifications(array $queryData): LengthAwarePaginator
    {
        $query = $this->makeQuery($queryData['notifiable']['type'] ?? null, $queryData['notifiable']['id'] ?? null);
        $this->applyFilters($query, $queryData);
        [$field, $direction] = $this->resolveSort($queryData);

        return $query->orderBy($field, $direction)
            ->paginate($queryData['pageSize'] ?? 10);
    }

    /**
     * @param  array<string, mixed>  $queryData
     */
    public function getUnreadNotifications(array $queryData): Collection
    {
        $query = $this->makeQuery($queryData['notifiable']['type'] ?? null, $queryData['notifiable']['id'] ?? null)
            ->whereNull('read_at');
        [$field, $direction] = $this->resolveSort($queryData);

        return $query->orderBy($field, $direction)
            ->take($queryData['take'] ?? 10)
            ->get();
    }

    /**
     * Number of unread notifications the owner has, ignoring any page limit.
     */
    public function countUnreadForUser(int|string|null $notifiableId): int
    {
        if ($notifiableId === null) {
            return 0;
        }

        return $this->makeQuery('user', $notifiableId)->whereNull('read_at')->count();
    }

    /**
     * The distinct notification classes the owner has actually received, so the
     * UI can offer a type filter that matches reality instead of guessing.
     *
     * @return array<int, string>
     */
    public function availableTypesForUser(int|string|null $notifiableId): array
    {
        if ($notifiableId === null) {
            return [];
        }

        /** @var array<int, string> $types */
        $types = $this->makeQuery('user', $notifiableId)
            ->distinct()
            ->orderBy('type')
            ->pluck('type')
            ->all();

        return $types;
    }

    /**
     * Mark the given notifications as read, scoped to the owner.
     *
     * @param  array<int, string>  $ids
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
     * @param  array<int, string>  $ids
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
     * @param  array<int, string>  $ids
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

    /**
     * @param  Builder<Notification>  $query
     * @param  array<string, mixed>  $queryData
     */
    private function applyFilters(Builder $query, array $queryData): void
    {
        $filter = $queryData['filter'] ?? 'all';
        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif ($filter === 'read') {
            $query->whereNotNull('read_at');
        }

        if (! empty($queryData['type'])) {
            $query->where('type', $queryData['type']);
        }

        $search = trim((string) ($queryData['search'] ?? ''));
        if ($search !== '') {
            // `data` is a TEXT column holding the notification payload (title,
            // message, …); a LIKE over it searches every payload key at once
            // without depending on the driver's JSON support.
            $escaped = addcslashes($search, '%_\\');
            $query->where('data', 'like', "%{$escaped}%");
        }
    }

    /**
     * @param  array<string, mixed>  $queryData
     * @return array{0: string, 1: string}
     */
    private function resolveSort(array $queryData): array
    {
        $field = $queryData['sort']['field'] ?? null;
        if (! in_array($field, self::SORTABLE, true)) {
            // `id` is a UUID — ordering by it is arbitrary, not chronological.
            $field = 'created_at';
        }

        $direction = strtolower((string) ($queryData['sort']['sort'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';

        return [$field, $direction];
    }

    /**
     * @return Builder<Notification>
     */
    private function makeQuery(?string $notifiableType = null, int|string|null $notifiableId = null): Builder
    {
        $query = Notification::query();
        if ($notifiableType !== null && $notifiableId === null) {
            // Scoping was asked for but there is no owner to scope to — return
            // nothing rather than silently falling back to every user's rows.
            return $query->whereRaw('1 = 0');
        }
        if ($notifiableType && $notifiableId) {
            $query
                ->where('notifiable_id', $notifiableId)
                ->where('notifiable_type', $notifiableType);
        }

        return $query;
    }
}
