<?php

declare(strict_types=1);

namespace App\Domains\Document\Adapters;

use App\Domains\User\Models\User;
use App\Domains\User\Services\UserService;

/**
 * Adapter that lets the Document domain read a user's document-tag permissions
 * without reaching into the User domain's services directly.
 */
class UserAdapter
{
    /**
     * The document tags the given user (or the authenticated user) may access.
     *
     * @return array<int, string>
     */
    public function getAllowedDocumentTags(?User $user = null): array
    {
        return UserService::getAllowedDocumentTags($user);
    }
}
