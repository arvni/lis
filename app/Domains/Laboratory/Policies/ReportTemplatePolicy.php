<?php

namespace App\Domains\Laboratory\Policies;

use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\User\Models\User;

class ReportTemplatePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can("Advance Settings.Report Templates.List Report Templates");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ReportTemplate $reportTemplate): bool
    {
        return $user->can("Advance Settings.Report Templates.Create Report Template");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can("Advance Settings.Report Templates.Create Report Template");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ReportTemplate $reportTemplate): bool
    {
        return $user->can("Advance Settings.Report Templates.Edit Report Template");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ReportTemplate $reportTemplate): bool
    {
        return $user->can("Advance Settings.Report Templates.Delete Report Template");
    }
}
