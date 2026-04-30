<?php

$providers = [
    App\Providers\AppServiceProvider::class,
    App\Providers\EventServiceProvider::class,
    App\Providers\OmantelSmsServiceProvider::class,
    App\Providers\WhatsAppServiceProvider::class,
];

if (env('TELESCOPE_ENABLED', false)) {
    $providers[] = App\Providers\TelescopeServiceProvider::class;
}

return $providers;
