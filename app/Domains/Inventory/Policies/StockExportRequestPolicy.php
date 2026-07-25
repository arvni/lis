<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Policies;

use App\Domains\User\Models\User;

class StockExportRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Inventory.ExportRequests.List Export Requests');
    }

    public function create(User $user): bool
    {
        return $user->can('Inventory.ExportRequests.Create Export Request');
    }

    public function approve(User $user): bool
    {
        return $user->can('Inventory.ExportRequests.Approve Export Request');
    }

    public function fulfill(User $user): bool
    {
        return $user->can('Inventory.ExportRequests.Fulfill Export Request');
    }
}
