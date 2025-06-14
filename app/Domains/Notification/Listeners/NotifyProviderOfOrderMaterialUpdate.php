<?php

namespace App\Domains\Notification\Listeners;

use App\Domains\Notification\Jobs\SendOrderMaterialUpdateWebhook;

class NotifyProviderOfOrderMaterialUpdate
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
        SendOrderMaterialUpdateWebhook::dispatch($event->orderMaterial);
    }
}
