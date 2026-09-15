<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Repositories;

use App\Domains\Attendance\Enums\LeaveApprovalStatus;
use App\Domains\Attendance\Enums\LeaveRequestStatus;
use App\Domains\Attendance\Models\LeaveRequest;
use App\Domains\Attendance\Models\LeaveRequestApproval;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Pagination\LengthAwarePaginator;

class LeaveRequestRepository
{
    use LogsUserActivity;

    private const SORTABLE = ['id', 'start_date', 'created_at'];

    private const RELATIONS = [
        'user:id,name',
        'requestedBy:id,name',
        'kind:id,name',
        'cancelledBy:id,name',
        'approvals.approverUser:id,name',
        'approvals.actedBy:id,name',
    ];

    /**
     * Requests the person takes or entered.
     *
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, LeaveRequest>
     */
    public function listForUser(array $queryData, int $userId): LengthAwarePaginator
    {
        $query = $this->filtered($queryData['filters'] ?? [])
            ->where(fn (Builder $mine) => $mine->where('user_id', $userId)->orWhere('requested_by', $userId));

        return $this->paginate($query, $queryData);
    }

    /**
     * Pending requests whose current step this person can approve (never their own leave).
     *
     * @param  array<string, mixed>  $queryData
     * @param  list<string>  $roles  the person's role names
     * @return LengthAwarePaginator<int, LeaveRequest>
     */
    public function listAwaiting(array $queryData, int $userId, array $roles, bool $isLeaveManager): LengthAwarePaginator
    {
        $query = $this->filtered($queryData['filters'] ?? [])
            ->where('status', LeaveRequestStatus::PENDING->value)
            ->where('user_id', '!=', $userId)
            ->whereHas('approvals', function (Builder $approval) use ($userId, $roles, $isLeaveManager) {
                $approval->where('status', LeaveApprovalStatus::PENDING->value)
                    // The current step: no pending step comes before it.
                    ->whereNotExists(fn (QueryBuilder $earlier) => $earlier
                        ->from('leave_request_approvals as earlier')
                        ->whereColumn('earlier.leave_request_id', 'leave_request_approvals.leave_request_id')
                        ->where('earlier.status', LeaveApprovalStatus::PENDING->value)
                        ->whereColumn('earlier.sort_order', '<', 'leave_request_approvals.sort_order'))
                    ->where(function (Builder $approver) use ($userId, $roles, $isLeaveManager) {
                        $approver->where('approver_user_id', $userId);
                        if ($roles !== []) {
                            $approver->orWhere(fn (Builder $byRole) => $byRole
                                ->whereNull('approver_user_id')
                                ->whereIn('approver_role', $roles));
                        }
                        if ($isLeaveManager) {
                            $approver->orWhere(fn (Builder $managers) => $managers
                                ->whereNull('approver_user_id')
                                ->whereNull('approver_role'));
                        }
                    });
            });

        return $this->paginate($query, $queryData);
    }

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, LeaveRequest>
     */
    public function listAll(array $queryData): LengthAwarePaginator
    {
        return $this->paginate($this->filtered($queryData['filters'] ?? []), $queryData);
    }

    /**
     * Pending or approved leave of the person that touches any of the dates.
     *
     * @return Collection<int, LeaveRequest>
     */
    public function activeOnDates(int $userId, string $from, string $to): Collection
    {
        return LeaveRequest::query()
            ->where('user_id', $userId)
            ->whereIn('status', [LeaveRequestStatus::PENDING->value, LeaveRequestStatus::APPROVED->value])
            ->where('start_date', '<=', $to)
            ->where('end_date', '>=', $from)
            ->get();
    }

    /**
     * One person's pending or approved leave touching any day between the dates, with its kind.
     *
     * @return Collection<int, LeaveRequest>
     */
    public function activeForUserBetween(int $userId, string $from, string $to): Collection
    {
        return LeaveRequest::query()
            ->with('kind:id,name')
            ->where('user_id', $userId)
            ->whereIn('status', [LeaveRequestStatus::PENDING->value, LeaveRequestStatus::APPROVED->value])
            ->where('start_date', '<=', $to)
            ->where('end_date', '>=', $from)
            ->orderBy('start_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Everyone's pending or approved leave touching any day between the dates, with its kind.
     *
     * @return Collection<int, LeaveRequest>
     */
    public function activeBetween(string $from, string $to): Collection
    {
        return LeaveRequest::query()
            ->with('kind:id,name')
            ->whereIn('status', [LeaveRequestStatus::PENDING->value, LeaveRequestStatus::APPROVED->value])
            ->where('start_date', '<=', $to)
            ->where('end_date', '>=', $from)
            ->orderBy('user_id')
            ->orderBy('start_date')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Approved leave touching any day between the dates (Y-m-d, inclusive).
     *
     * @param  list<int>|null  $userIds  only these people (null = everyone)
     * @return Collection<int, LeaveRequest>
     */
    public function approvedBetween(string $from, string $to, ?array $userIds): Collection
    {
        return LeaveRequest::query()
            ->where('status', LeaveRequestStatus::APPROVED->value)
            ->when($userIds !== null, fn (Builder $query) => $query->whereIn('user_id', $userIds))
            ->where('start_date', '<=', $to)
            ->where('end_date', '>=', $from)
            ->get(['id', 'user_id', 'type', 'start_date', 'end_date', 'start_time', 'end_time']);
    }

    /**
     * The request, locked for the rest of the transaction, with its steps.
     */
    public function lock(LeaveRequest $leave): LeaveRequest
    {
        $locked = LeaveRequest::query()->lockForUpdate()->findOrFail($leave->id);
        $locked->load('approvals');

        return $locked;
    }

    public function loadDetails(LeaveRequest $leave): LeaveRequest
    {
        return $leave->loadMissing(self::RELATIONS);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): LeaveRequest
    {
        $leave = LeaveRequest::query()->make($data);
        $leave->save();
        $this->logCreated($leave);

        return $leave;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(LeaveRequest $leave, array $data): LeaveRequest
    {
        $leave->fill($data);
        if ($leave->isDirty()) {
            $leave->save();
            $this->logUpdated($leave);
        }

        return $leave;
    }

    /**
     * @param  list<array<string, mixed>>  $steps
     */
    public function createApprovals(LeaveRequest $leave, array $steps): void
    {
        $leave->approvals()->createMany($steps);
        $leave->unsetRelation('approvals');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateApproval(LeaveRequestApproval $approval, array $data): void
    {
        $approval->fill($data)->save();
    }

    /** Steps still waiting when a request is rejected or cancelled will never be reached. */
    public function skipPendingApprovals(LeaveRequest $leave): void
    {
        LeaveRequestApproval::query()
            ->where('leave_request_id', $leave->id)
            ->where('status', LeaveApprovalStatus::PENDING->value)
            ->update(['status' => LeaveApprovalStatus::SKIPPED->value]);
    }

    /**
     * Filters: `status`, `leave_kind_id`, `type`, `user` ({id}) and `from_date`/`to_date` (leave touching the range).
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<LeaveRequest>
     */
    private function filtered(array $filters): Builder
    {
        return LeaveRequest::query()
            ->with(self::RELATIONS)
            ->when(! empty($filters['status']), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when(! empty($filters['leave_kind_id']), fn (Builder $query) => $query->where('leave_kind_id', (int) $filters['leave_kind_id']))
            ->when(! empty($filters['type']), fn (Builder $query) => $query->where('type', $filters['type']))
            ->when(! empty($filters['user']['id']), fn (Builder $query) => $query->where('user_id', (int) $filters['user']['id']))
            ->when(! empty($filters['from_date']), fn (Builder $query) => $query->where('end_date', '>=', $filters['from_date']))
            ->when(! empty($filters['to_date']), fn (Builder $query) => $query->where('start_date', '<=', $filters['to_date']));
    }

    /**
     * @param  Builder<LeaveRequest>  $query
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, LeaveRequest>
     */
    private function paginate(Builder $query, array $queryData): LengthAwarePaginator
    {
        $field = $queryData['sort']['field'] ?? 'id';

        return $query
            ->orderBy(
                in_array($field, self::SORTABLE, true) ? $field : 'id',
                ($queryData['sort']['sort'] ?? 'desc') === 'asc' ? 'asc' : 'desc'
            )
            ->orderByDesc('id')
            ->paginate($queryData['pageSize'] ?? 10);
    }
}
