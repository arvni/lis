<?php

namespace App\Domains\Inventory\Notifications;

use App\Domains\Inventory\Models\PurchaseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PurchaseRequestApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly PurchaseRequest $pr) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Purchase Request #{$this->pr->id} Approved")
            ->line("Your purchase request **#{$this->pr->id}** has been fully approved.")
            ->line("All workflow steps have been completed. It is now ready to proceed to ordering.")
            ->action("View Purchase Request #{$this->pr->id}", url(route('inventory.purchase-requests.show', $this->pr->id)));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'    => 'pr_approved',
            'pr_id'   => $this->pr->id,
            'message' => "Your purchase request #{$this->pr->id} has been approved.",
            'link'    => route('inventory.purchase-requests.show', $this->pr->id),
        ];
    }
}
