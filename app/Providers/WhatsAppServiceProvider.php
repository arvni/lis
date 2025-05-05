<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Notifications\Channels\TwilioWhatsAppTemplateChannel;
use Twilio\Rest\Client as TwilioClient;

class WhatsAppServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(TwilioWhatsAppTemplateChannel::class, function ($app) {
            $config = $app['config']['services.twilio'];
            return new TwilioWhatsAppTemplateChannel(
                new TwilioClient($config['sid'], $config['token']),
                $config['whatsapp_from'],
                $config['whatsapp_ssid'],
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
