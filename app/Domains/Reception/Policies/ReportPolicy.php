<?php

namespace App\Domains\Reception\Policies;

use App\Domains\Reception\Models\Report;
use App\Domains\User\Models\User;

class ReportPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $authUser): bool
    {
        return $authUser->can("Report.List Reports");
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $authUser): bool
    {
        return $authUser->can("Report.Create Report");
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Report $report): bool
    {
        return $user->can("Report.View Report");
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $authUser, Report $report): bool
    {
        return $authUser->can("Report.Edit Report");
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $authUser, Report $report): bool
    {
        return $authUser->can("Report.Delete Report");
    }

    public function editAll(User $authUser): bool
    {
        return $authUser->can("Report.Edit All Reports");
    }

    public function accessAll(User $authUser): bool
    {
        return $authUser->can("Report.Access All Reports");
    }

    public function approve(User $authUser, Report $report): bool
    {
        return $authUser->can("Report.Approve Report");
    }

    public function print(User $authUser, Report $report): bool
    {
        return $authUser->can("Report.Print Report");
    }

    public function publish(User $authUser, Report $report): bool
    {
        return $authUser->can("Report.Publish Report");
    }

    public function unpublish(User $authUser, Report $report): bool
    {
        return $authUser->can("Report.Unpublish Report");
    }

}
