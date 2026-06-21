<?php

namespace App\Domains\User\Repositories;

use App\Domains\User\Models\UserActivity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserActivityRepository
{
    /**
     * Paginated audit-log activities (newest first) filtered by user, activity
     * type, related model type and a created-at date range.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginateAuditLog(array $filters, int $perPage = 50): LengthAwarePaginator
    {
        $query = UserActivity::query()
            ->with('user:id,name')
            ->latest();

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        if (!empty($filters['activity_type'])) {
            $query->where('activity_type', $filters['activity_type']);
        }
        if (!empty($filters['related_type'])) {
            $query->where('related_type', 'like', '%' . $filters['related_type'] . '%');
        }
        if (!empty($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        return $query->paginate($perPage);
    }
}
