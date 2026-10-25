<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Listeners;

use App\Domains\PreOrder\Events\QuotationDecided;
use App\Domains\PreOrder\Notifications\QuotationDecidedNotification;
use App\Domains\User\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;

/** Tells the finance desk and the case's counsellor how the center decided. */
class NotifyFinanceDesk implements ShouldQueue
{
    public function handle(QuotationDecided $event): void
    {
        $quotation = $event->quotation->load('preOrder:id,code,assigned_to');
        try {
            $recipients = User::permission('PreOrders.Finance.Quote')->get();
        } catch (PermissionDoesNotExist) {
            // Not seeded yet on this install: the counsellor still hears about it.
            $recipients = new Collection;
        }
        if ($quotation->preOrder->assigned_to !== null) {
            $recipients = $recipients->push(User::query()->find($quotation->preOrder->assigned_to))->filter()->unique('id');
        }

        Notification::send($recipients, new QuotationDecidedNotification($quotation));
    }
}
