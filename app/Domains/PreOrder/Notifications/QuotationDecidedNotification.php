<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Notifications;

use App\Domains\PreOrder\Models\PreOrderQuotation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/** Staff alert, database channel only. */
class QuotationDecidedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly PreOrderQuotation $quotation) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $code = $this->quotation->preOrder->code;

        return [
            'type' => 'pre_order_quotation',
            'pre_order_id' => $this->quotation->pre_order_id,
            'quotation' => $this->quotation->number,
            'status' => $this->quotation->status->value,
            'message' => "{$code}: quotation {$this->quotation->number} {$this->quotation->status->label()}",
            'link' => route('pre-orders.show', $this->quotation->pre_order_id),
        ];
    }
}
