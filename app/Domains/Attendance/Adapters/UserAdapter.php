<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Adapters;

use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;

/**
 * Adapter that translates between the Attendance and User domains: HikCentral punches carry an
 * Employee ID, which the User domain stores as users.attendance_number.
 */
readonly class UserAdapter
{
    public function __construct(private UserRepository $userRepository) {}

    public function findAttendanceNumber(int $userId): ?string
    {
        return $this->userRepository->findById($userId)?->attendance_number;
    }

    /**
     * @param  list<string>  $attendanceNumbers
     * @return array<string, User> keyed by attendance number
     */
    public function getUsersByAttendanceNumbers(array $attendanceNumbers): array
    {
        if ($attendanceNumbers === []) {
            return [];
        }

        $users = [];
        foreach ($this->userRepository->getByAttendanceNumbers($attendanceNumbers) as $user) {
            $users[(string) $user->attendance_number] = $user;
        }

        return $users;
    }

    /**
     * @param  list<int>  $userIds
     * @return array<int, string> attendance numbers keyed by user id; users without one are left out
     */
    public function getAttendanceNumbersForUsers(array $userIds): array
    {
        return $userIds === [] ? [] : $this->userRepository->getAttendanceNumbersByIds($userIds);
    }

    /**
     * @return list<string>
     */
    public function getAllAttendanceNumbers(): array
    {
        return $this->userRepository->getAttendanceNumbers();
    }
}
