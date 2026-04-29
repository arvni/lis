<?php

namespace App\Console\Commands;

use App\Domains\Inventory\Models\PurchaseRequestApproval;
use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\Inventory\Notifications\PurchaseRequestOverdueNotification;
use App\Domains\User\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class EscalateOverduePurchaseRequestSteps extends Command
{
    protected $signature   = 'inventory:escalate-overdue-pr-steps';
    protected $description = 'Notify approvers (and store managers) about overdue PR approval steps';

    public function handle(): void
    {
        $overdue = PurchaseRequestApproval::where('status', ApprovalStatus::PENDING)
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->with(['step.approverUser', 'purchaseRequest.requestedBy'])
            ->get();

        // Load once outside the loop
        $storeManagers = User::role('Store Manager')->get();

        foreach ($overdue as $approval) {
            $daysOverdue = (int) now()->diffInDays($approval->due_at);
            $pr          = $approval->purchaseRequest;
            $step        = $approval->step;
            $notification = new PurchaseRequestOverdueNotification($pr, $step, $daysOverdue);

            // Notify the assigned approver(s)
            if ($step->approver_user_id) {
                optional(User::find($step->approver_user_id))->notify($notification);
            } elseif ($step->approver_role) {
                $role = Role::findByName($step->approver_role, 'web');
                if ($role) {
                    User::role($role)->get()->each->notify($notification);
                }
            }

            // Also escalate to Store Managers if not already escalated
            if (!$approval->escalated) {
                $storeManagers->each->notify($notification);
                $approval->update(['escalated' => true]);
            }

            $this->line("Escalated PR #{$pr->id} step \"{$step->name}\" ({$daysOverdue}d overdue)");
        }

        $this->info("Done. {$overdue->count()} overdue step(s) processed.");
    }
}
