<?php

namespace App\Domains\Notification\Listeners;

use App\Domains\Notification\Jobs\SendOrderMaterialUpdateWebhook;
use App\Domains\Notification\Jobs\SendRequestFormUpdateWebhook;

class NotifyProviderOfRequestFormUpdate
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
    public function handle(object $event): void
    {
        SendRequestFormUpdateWebhook::dispatch($event->requestForm,$event->action);
    }
}
