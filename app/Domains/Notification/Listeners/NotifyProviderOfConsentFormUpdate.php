<?php

namespace App\Domains\Notification\Listeners;

use App\Domains\Notification\Jobs\SendConsentFormUpdateWebhook;

class NotifyProviderOfConsentFormUpdate
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
        SendConsentFormUpdateWebhook::dispatch($event->consentForm,$event->action);
    }
}
