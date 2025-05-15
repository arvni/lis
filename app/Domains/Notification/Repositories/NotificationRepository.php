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
