<?php

namespace App\Domains\Inventory\Notifications;

use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\WorkflowStep;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PurchaseRequestRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly PurchaseRequest $pr,
        public readonly WorkflowStep    $step,
        public readonly string          $reason,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Purchase Request #{$this->pr->id} Rejected")
            ->line("Your purchase request **#{$this->pr->id}** was rejected at step: **{$this->step->name}**.")
            ->line("**Reason:** {$this->reason}")
            ->line("The request has been returned to Draft. Please revise and re-submit.")
            ->action("View Purchase Request #{$this->pr->id}", url(route('inventory.purchase-requests.show', $this->pr->id)));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'    => 'pr_rejected',
            'pr_id'   => $this->pr->id,
            'message' => "Your purchase request #{$this->pr->id} was rejected at step \"{$this->step->name}\": {$this->reason}",
            'link'    => route('inventory.purchase-requests.show', $this->pr->id),
        ];
    }
}
