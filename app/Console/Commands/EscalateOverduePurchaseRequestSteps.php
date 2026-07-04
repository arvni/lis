<?php

namespace App\Console\Commands;

use App\Domains\Inventory\Models\PurchaseRequestApproval;
use App\Domains\Inventory\Enums\ApprovalStatus;
use App\Domains\Inventory\Notifications\PurchaseRequestOverdueNotification;
use App\Domains\User\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class EscalateOverduePurchaseRequestSteps extends Command
{
    protected $signature   = 'inventory:escalate-overdue-pr-steps';
    protected $description = 'Notify approvers (and store managers) about overdue PR approval steps';

    public function handle(): int
    {
        try {
            $overdue = PurchaseRequestApproval::where('status', ApprovalStatus::PENDING)
                ->whereNotNull('due_at')
                ->where('due_at', '<', now())
                ->with(['step.approverUser', 'purchaseRequest.requestedBy'])
                ->get();

            $storeManagers = User::role('Store Manager')->get();

            foreach ($overdue as $approval) {
                $daysOverdue = (int) now()->diffInDays($approval->due_at);
                $pr          = $approval->purchaseRequest;
                $step        = $approval->step;
                $notification = new PurchaseRequestOverdueNotification($pr, $step, $daysOverdue);

                if ($step->approver_user_id) {
                    optional(User::find($step->approver_user_id))->notify($notification);
                } elseif ($step->approver_role) {
                    // Query (not Role::findByName, which throws) so an unknown role
                    // name skips this step instead of aborting the whole batch.
                    $role = Role::where('name', $step->approver_role)
                        ->where('guard_name', 'web')
                        ->first();
                    if ($role) {
                        User::role($role)->get()->each->notify($notification);
                    }
                }

                if (!$approval->escalated) {
                    $storeManagers->each->notify($notification);
                    // Direct assignment (not update([...])) — 'escalated' is not
                    // mass-assignable, so update() would silently drop it and the
                    // store managers would be re-notified on every run.
                    $approval->escalated = true;
                    $approval->save();
                }

                $this->line("Escalated PR #{$pr->id} step \"{$step->name}\" ({$daysOverdue}d overdue)");
            }

            $this->info("Done. {$overdue->count()} overdue step(s) processed.");
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Failed to escalate overdue PR steps: {$e->getMessage()}");
            Log::error('inventory:escalate-overdue-pr-steps failed', ['exception' => $e]);
            return Command::FAILURE;
        }
    }
}
