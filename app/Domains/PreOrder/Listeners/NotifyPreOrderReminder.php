<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Listeners;

use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Events\PreOrderReminderDue;
use App\Domains\PreOrder\Notifications\PreOrderReminderNotification;
use App\Domains\User\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;

/**
 * Staff alerts for a stuck pre-order, database channel only. A reminder goes to the case's
 * counsellor when BION must act (the center hears through the provider panel); an escalation
 * goes to the team leads whoever must act, so someone can chase it.
 */
class NotifyPreOrderReminder implements ShouldQueue
{
    public function handle(PreOrderReminderDue $event): void
    {
        $preOrder = $event->preOrder;
        if ($event->escalation) {
            $recipients = $this->withPermission('PreOrders.Cases.Escalations');
        } elseif ($preOrder->action_owner === ActionOwner::BION) {
            $assignee = $preOrder->assigned_to ? User::query()->find($preOrder->assigned_to) : null;
            $recipients = $assignee ? new Collection([$assignee]) : $this->withPermission('PreOrders.Cases.Review');
        } else {
            return;
        }

        Notification::send($recipients, new PreOrderReminderNotification($preOrder, $event->escalation));
    }

    /** @return Collection<int, User> */
    private function withPermission(string $permission): Collection
    {
        try {
            return User::permission($permission)->get();
        } catch (PermissionDoesNotExist) {
            return new Collection;
        }
    }
}
