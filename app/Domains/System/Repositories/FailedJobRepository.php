<?php

declare(strict_types=1);

namespace App\Domains\System\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FailedJobRepository
{
    /**
     * Paginated failed jobs, filtered by free-text search, job type and queue.
     */
    public function paginate(
        ?string $search,
        ?string $jobType,
        ?string $queue,
        string $sortField,
        string $sortDir,
        int $pageSize,
    ): LengthAwarePaginator {
        $query = DB::table('failed_jobs')->orderBy($sortField, $sortDir);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('payload', 'like', "%{$search}%")
                    ->orWhere('exception', 'like', "%{$search}%")
                    ->orWhere('uuid', 'like', "%{$search}%");
            });
        }

        if ($jobType) {
            $query->where('payload', 'like', "%{$jobType}%");
        }

        if ($queue) {
            $query->where('queue', $queue);
        }

        return $query->paginate($pageSize);
    }

    /**
     * Failed-job counts grouped by job type (decoded from the payload displayName).
     */
    public function typeSummary(int $limit = 20): Collection
    {
        return DB::table('failed_jobs')
            ->selectRaw("SUBSTRING_INDEX(SUBSTRING_INDEX(payload, '\"displayName\":\"', -1), '\"', 1) as job_type, COUNT(*) as count")
            ->groupBy('job_type')
            ->orderByDesc('count')
            ->limit($limit)
            ->get();
    }

    /**
     * Distinct queue names present among failed jobs.
     */
    public function distinctQueues(): Collection
    {
        return DB::table('failed_jobs')->distinct()->pluck('queue');
    }

    public function existsByUuid(string $uuid): bool
    {
        return DB::table('failed_jobs')->where('uuid', $uuid)->exists();
    }

    public function deleteByUuid(string $uuid): void
    {
        DB::table('failed_jobs')->where('uuid', $uuid)->delete();
    }

    /**
     * @param  array<int, string>  $uuids
     */
    public function deleteByUuids(array $uuids): void
    {
        DB::table('failed_jobs')->whereIn('uuid', $uuids)->delete();
    }
}
