<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Adapters;

use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;
use Illuminate\Database\Eloquent\Collection;

/**
 * Adapter that translates between the Inventory and User domains.
 */
readonly class UserAdapter
{
    public function __construct(private UserRepository $userRepository) {}

    public function findUser(int $id): ?User
    {
        return $this->userRepository->findById($id);
    }

    public function findUserOrFail(int $id): User
    {
        return $this->userRepository->findOrFail($id);
    }

    /**
     * Active users as id/name pairs for select lists (e.g. delegate pickers).
     *
     * @return Collection<int, User>
     */
    public function getActiveUsersForSelect(): Collection
    {
        return $this->userRepository->getActiveForSelect();
    }

    /**
     * Users holding the given role (used to notify step approvers).
     *
     * @return Collection<int, User>
     */
    public function getUsersWithRole(string $roleName): Collection
    {
        return $this->userRepository->getUsersByRoleName($roleName);
    }
}
