<?php

namespace App\Domains\Reception\Policies;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\User\Models\User;

class AcceptancePolicy
{
        /**
         * Determine whether the user can view any models.
         */
        public function viewAny(User $authUser): bool
    {
        return $authUser->can("Reception.Acceptances.List Acceptance");
    }

        /**
         * Determine whether the user can create models.
         */
        public function create(User $authUser): bool
    {
        return $authUser->can("Reception.Acceptances.Create Acceptance");
    }

        /**
         * Determine whether the user can view the model.
         */
        public function view(User $user): bool
    {
        return $user->can("Reception.Acceptances.View Acceptance");
    }

        /**
         * Determine whether the user can update the model.
         */
        public function update(User $authUser, Acceptance $acceptance): bool
    {
        $allowed = $authUser->can("Reception.Acceptances.Edit Acceptance") || $acceptance->status == AcceptanceStatus::PENDING;
        if (!$allowed) return false;
        if ($acceptance->invoice_id) {
            return $authUser->can("Reception.Acceptances.Edit Invoiced Acceptance");
        }
        return true;
    }

    public function cancel(User $authUser, Acceptance $acceptance): bool
    {
        $allowed = $authUser->can("Reception.Acceptances.Cancel Acceptance");
        if (!$allowed) return false;
        if ($acceptance->invoice_id) {
            return $authUser->can("Reception.Acceptances.Edit Invoiced Acceptance");
        }
        return true;
    }

    public function delete(User $authUser, Acceptance $acceptance): bool
    {
        $allowed = $authUser->can("Reception.Acceptances.Delete Acceptance") || $acceptance->status == AcceptanceStatus::PENDING;
        if (!$allowed) return false;
        if ($acceptance->invoice_id) {
            return $authUser->can("Reception.Acceptances.Edit Invoiced Acceptance");
        }
        return true;
    }

    public function editInvoiced(User $authUser): bool
    {
        return $authUser->can("Reception.Acceptances.Edit Invoiced Acceptance");
    }

    /**
     * Determine whether the user can edit the price and discount of an
     * acceptance's items. This is only allowed before an invoice has been
     * created for the acceptance.
     */
    public function editItemPrices(User $authUser, Acceptance $acceptance): bool
    {
        if ($acceptance->invoice_id) {
            return false;
        }
        return $authUser->can("Reception.Acceptances.Edit Item Prices");
    }

    public function sampleCollection(User $authUser): bool
    {
        return $authUser->can("Sample Collection");
    }

    /**
     * Determine whether the user can view financial check page.
     */
    public function financialCheck(User $authUser): bool
    {
        return $authUser->can("Report.Financial Check");
    }

    /**
     * Determine whether the user can approve financial for the acceptance.
     */
    public function approveFinancial(User $authUser, Acceptance $acceptance): bool
    {
        return $authUser->can("Report.Approve Financial");
    }

    /**
     * Determine whether the user can check and update acceptance status.
     */
    public function checkStatus(User $authUser, Acceptance $acceptance): bool
    {
        return $authUser->can("Reception.Acceptances.Check Status");
    }
}
