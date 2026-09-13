<?php

declare(strict_types=1);

namespace App\Domains\Reception\Adapters;

use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;
use App\Domains\User\Services\PermissionService;
use Illuminate\Database\Eloquent\Collection;

readonly class UserAdapter
{
    public function __construct(
        private PermissionService $permissionService,
        private UserRepository $userRepository,
    ) {}

    public function getUserAllowedDocumentTags(): array
    {
        return $this->permissionService->getUserAllowedDocumentTags();
    }

    /**
     * Active users to remind for a TAT alert: the picked users plus everyone holding a picked role.
     *
     * @param  list<int>  $userIds
     * @param  list<int>  $roleIds
     * @return Collection<int, User>
     */
    public function getAlertRecipients(array $userIds, array $roleIds): Collection
    {
        return $this->userRepository->getActiveByIdsOrRoleIds($userIds, $roleIds);
    }
}
