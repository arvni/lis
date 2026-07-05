<?php

namespace App\Domains\Inventory\Notifications;

use App\Domains\Inventory\Models\PurchaseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PurchaseRequestApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly PurchaseRequest $pr) {}

    public function via(object $notifiable): array
    {
        return ['database'];
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
