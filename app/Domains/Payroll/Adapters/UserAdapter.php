<?php

declare(strict_types=1);

namespace App\Domains\Payroll\Adapters;

use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;
use Illuminate\Database\Eloquent\Collection;

/**
 * The Payroll domain's only door into the User domain: contracts and salary slips are about
 * people, but nothing here should reach into how users are stored.
 */
readonly class UserAdapter
{
    public function __construct(private UserRepository $userRepository) {}

    public function findUserOrFail(int $userId): User
    {
        return $this->userRepository->findOrFail($userId);
    }

    /**
     * Active users as id/name pairs, narrowed by name, for the person pickers.
     *
     * @return Collection<int, User>
     */
    public function searchActiveUsers(?string $search): Collection
    {
        return $this->userRepository->searchActiveForSelect($search);
    }
}
