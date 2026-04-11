<?php

namespace App\Domains\Notification\Listeners;

use App\Domains\Notification\Jobs\SendOrderMaterialCreatedWebhook;
use App\Domains\Referrer\Events\OrderMaterialCreated;

class NotifyProviderOfOrderMaterialCreated
{
    public function handle(OrderMaterialCreated $event): void
    {
        SendOrderMaterialCreatedWebhook::dispatch($event->orderMaterial->id);
    }
}
