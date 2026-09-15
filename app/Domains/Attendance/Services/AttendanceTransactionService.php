<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Services;

use App\Domains\Attendance\Adapters\UserAdapter;
use App\Domains\Attendance\Models\AttendanceTransaction;
use App\Domains\Attendance\Repositories\AttendanceTransactionRepository;
use App\Domains\User\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class AttendanceTransactionService
{
    public function __construct(
        private readonly AttendanceTransactionRepository $transactionRepository,
        private readonly UserAdapter $userAdapter,
    ) {}

    /**
     * Filters: `user` ({id}), `attendance_id`, `from_date`/`to_date` (Y-m-d) and `unmatched`
     * (only punches whose Employee ID belongs to no user).
     *
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, AttendanceTransaction>
     */
    public function listTransactions(array $queryData): LengthAwarePaginator
    {
        $filters = $queryData['filters'] ?? [];
        $only = null;
        $except = null;

        $userId = $filters['user']['id'] ?? null;
        if ($userId) {
            $number = $this->userAdapter->findAttendanceNumber((int) $userId);
            // A user without an attendance number has no punches.
            $only = $number === null ? [] : [$number];
        }

        if (filter_var($filters['unmatched'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $except = $this->userAdapter->getAllAttendanceNumbers();
        }

        return $this->transactionRepository->listTransactions($queryData, $only, $except);
    }

    /**
     * The LIS users behind these punches, in one query.
     *
     * @param  iterable<AttendanceTransaction>  $transactions
     * @return array<string, User> keyed by attendance number
     */
    public function usersFor(iterable $transactions): array
    {
        $numbers = [];
        foreach ($transactions as $transaction) {
            $numbers[$transaction->attendance_id] = true;
        }

        return $this->userAdapter->getUsersByAttendanceNumbers(array_map('strval', array_keys($numbers)));
    }
}
