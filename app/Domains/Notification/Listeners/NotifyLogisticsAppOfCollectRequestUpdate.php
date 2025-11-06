<?php

namespace App\Domains\Notification\Listeners;

use App\Domains\Notification\Jobs\SendCollectRequestWebhook;
use App\Domains\Referrer\Events\CollectRequestEvent;

class NotifyLogisticsAppOfCollectRequestUpdate
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(CollectRequestEvent $event): void
    {
        SendCollectRequestWebhook::dispatch($event->id, $event->action);
    }
}
