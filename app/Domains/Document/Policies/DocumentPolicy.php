<?php

namespace App\Domains\Document\Policies;

use App\Domains\User\Models\User;

class DocumentPolicy
{
    public function create(User $user): bool
    {
        return $user->can('Document.Documents.Create Document');
    }

    public function view(User $user): bool
    {
        return $user->can('Document.Documents.View Document');
    }

    public function update(User $user): bool
    {
        return $user->can('Document.Documents.Edit Document');
    }

    public function delete(User $user): bool
    {
        return $user->can('Document.Documents.Delete Document');
    }
}
