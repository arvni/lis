<?php

namespace App\Domains\Reception\Adapters;

use App\Domains\User\Services\PermissionService;

readonly class UserAdapter
{
    public function __construct(private PermissionService $permissionService)
    {
    }

    public function getUserAllowedDocumentTags()
    {
        return $this->permissionService->getUserAllowedDocumentTags();
    }
}
