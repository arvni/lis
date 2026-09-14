<?php

declare(strict_types=1);

namespace App\Domains\Attendance\Adapters;

use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Exceptions\RoleDoesNotExist;

/**
 * Adapter that translates between the Attendance and User domains: HikCentral punches carry an
 * Employee ID, which the User domain stores as users.attendance_number.
 */
readonly class UserAdapter
{
    public function __construct(private UserRepository $userRepository) {}

    public function findUser(int $userId): ?User
    {
        return $this->userRepository->findById($userId);
    }

    public function findUserOrFail(int $userId): User
    {
        return $this->userRepository->findOrFail($userId);
    }

    /**
     * @param  list<int>  $userIds
     * @return array<int, User> keyed by user id
     */
    public function getUsersByIds(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        $users = [];
        foreach ($this->userRepository->getByIds($userIds) as $user) {
            $users[$user->id] = $user;
        }

        return $users;
    }

    /**
     * Active users as id/name pairs, narrowed by name, for the "on behalf of" picker.
     *
     * @return Collection<int, User>
     */
    public function searchActiveUsers(?string $search): Collection
    {
        return $this->userRepository->searchActiveForSelect($search);
    }

    /**
     * Active holders of a role; nobody when the role no longer exists.
     *
     * @return Collection<int, User>
     */
    public function getUsersWithRole(string $roleName): Collection
    {
        try {
            return $this->userRepository->getUsersByRoleName($roleName)->where('is_active', true)->values();
        } catch (RoleDoesNotExist) {
            return new Collection;
        }
    }

    /**
     * Active users holding a permission, directly or through a role; nobody when it doesn't exist.
     *
     * @return Collection<int, User>
     */
    public function getUsersWithPermission(string $permission): Collection
    {
        try {
            return $this->userRepository->getActiveUsersWithPermission($permission);
        } catch (PermissionDoesNotExist) {
            return new Collection;
        }
    }

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
