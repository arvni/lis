<?php

namespace App\Domains\Notification\Listeners;

use App\Domains\Notification\Jobs\SendConsentFormUpdateWebhook;
use App\Domains\Notification\Jobs\SendInstructionUpdateWebhook;

class NotifyProviderOfInstructionUpdate
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
        SendInstructionUpdateWebhook::dispatch($event->instruction,$event->action);
    }
}
