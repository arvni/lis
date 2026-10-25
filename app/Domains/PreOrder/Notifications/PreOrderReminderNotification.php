<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Notifications;

use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Support\FlowStages;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/** Staff alert, database channel only. */
class PreOrderReminderNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly PreOrder $preOrder, public readonly bool $escalation) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $stage = FlowStages::label($this->preOrder, $this->preOrder->stage);
        $days = (int) $this->preOrder->stage_entered_at?->diffInDays(now());

        return [
            'type' => $this->escalation ? 'pre_order_escalation' : 'pre_order_reminder',
            'pre_order_id' => $this->preOrder->id,
            'stage' => $this->preOrder->stage->value,
            'message' => ($this->escalation ? 'Escalated: ' : 'Reminder: ')."{$this->preOrder->code} has been at “{$stage}” for {$days} day(s), waiting on ".$this->preOrder->action_owner->value,
            'link' => route('pre-orders.show', $this->preOrder->id),
        ];
    }
}
