<?php

namespace App\Domains\Inventory\Notifications;

use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\WorkflowStep;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PurchaseRequestStepPendingNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly PurchaseRequest $pr,
        public readonly WorkflowStep    $step,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Action Required: Purchase Request #{$this->pr->id} — {$this->step->name}")
            ->line("A purchase request requires your approval at step: **{$this->step->name}**.")
            ->line("Requested by: **{$this->pr->requestedBy->name}** | Urgency: **{$this->pr->urgency}**")
            ->action("Review Purchase Request #{$this->pr->id}", url(route('inventory.purchase-requests.show', $this->pr->id)))
            ->line('Please log in to approve or reject this step.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'    => 'pr_step_pending',
            'pr_id'   => $this->pr->id,
            'message' => "PR #{$this->pr->id} is waiting for your approval — step: {$this->step->name}",
            'link'    => route('inventory.purchase-requests.show', $this->pr->id),
        ];
    }
}
