<?php

namespace App\Domains\Notification\Listeners;

use App\Domains\Notification\Jobs\SendSampleTypeUpdateWebhook;

class NotifyProviderOfSampleTypeUpdate
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
        SendSampleTypeUpdateWebhook::dispatch($event->sampleType,$event->action);
    }
}
