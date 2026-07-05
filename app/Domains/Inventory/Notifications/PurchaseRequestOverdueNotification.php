<?php

namespace App\Domains\Inventory\Notifications;

use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\WorkflowStep;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PurchaseRequestOverdueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly PurchaseRequest $pr,
        public readonly WorkflowStep    $step,
        public readonly int             $daysOverdue,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'    => 'pr_overdue',
            'pr_id'   => $this->pr->id,
            'message' => "PR #{$this->pr->id} is {$this->daysOverdue} day(s) overdue at step \"{$this->step->name}\".",
            'link'    => route('inventory.purchase-requests.show', $this->pr->id),
        ];
    }
}
