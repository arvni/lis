<?php

namespace App\Domains\Inventory\Notifications;

use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\WorkflowStep;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PurchaseRequestOverdueNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly PurchaseRequest $pr,
        public readonly WorkflowStep    $step,
        public readonly int             $daysOverdue,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Overdue Approval: Purchase Request #{$this->pr->id}")
            ->line("Purchase request **#{$this->pr->id}** has been waiting for approval at step **{$this->step->name}** for **{$this->daysOverdue} day(s)** past the deadline.")
            ->line("Requested by: **{$this->pr->requestedBy->name}** | Urgency: **{$this->pr->urgency}**")
            ->action("Review Purchase Request #{$this->pr->id}", url(route('inventory.purchase-requests.show', $this->pr->id)))
            ->line('Immediate action is required.');
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
