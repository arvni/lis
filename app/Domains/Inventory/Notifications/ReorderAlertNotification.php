<?php

namespace App\Domains\Inventory\Notifications;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReorderAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Item  $item,
        public readonly Store $store,
        public readonly float $currentQty,
        public readonly float $minimumLevel,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Low Stock Alert: {$this->item->name}")
            ->line("Stock level for **{$this->item->name}** ({$this->item->item_code}) at **{$this->store->name}** has fallen below the minimum threshold.")
            ->line("Current: {$this->currentQty} | Minimum: {$this->minimumLevel}")
            ->action('View Reorder Alerts', url(route('inventory.reorder-alerts.index')))
            ->line('Please create a purchase request to replenish stock.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'reorder_alert',
            'item_id'       => $this->item->id,
            'item_code'     => $this->item->item_code,
            'item_name'     => $this->item->name,
            'store_id'      => $this->store->id,
            'store_name'    => $this->store->name,
            'current_qty'   => $this->currentQty,
            'minimum_level' => $this->minimumLevel,
            'message'       => "Low stock: {$this->item->name} at {$this->store->name} ({$this->currentQty} remaining, min {$this->minimumLevel})",
            'link'          => route('inventory.reorder-alerts.index'),
        ];
    }
}
