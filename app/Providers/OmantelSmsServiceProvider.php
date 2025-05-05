<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Notifications\Channels\OmantelIsmartSmsChannel;

class OmantelSmsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(OmantelIsmartSmsChannel::class, function ($app) {
            $config = $app['config']['services.omantel'];

            return new OmantelIsmartSmsChannel(
                $config['api_url'],
                $config['username'],
                $config['password'],
                $config['sender_id']
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
