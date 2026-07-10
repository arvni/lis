<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class ValidateEnvCommand extends Command
{
    protected $signature   = 'env:validate';
    protected $description = 'Assert required environment variables are set and the database is reachable';

    private const REQUIRED_KEYS = [
        'APP_KEY',
        'DB_HOST',
        'DB_PORT',
        'DB_DATABASE',
        'DB_USERNAME',
        'DB_PASSWORD',
        'TWILIO_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_WHATSAPP_FROM',
        'PROVIDER_APP_WEBHOOK_SECRET',
        'LOGISTICS_APP_WEBHOOK_SECRET',
    ];

    public function handle(): int
    {
        // @phpstan-ignore larastan.noEnvCallsOutsideOfConfig (this command exists to validate raw env values, so it must bypass config)
        $missing = array_filter(self::REQUIRED_KEYS, fn (string $key) => blank(env($key)));

        if ($missing) {
            $this->error('Missing required environment variables:');
            foreach ($missing as $key) {
                $this->line("   - {$key}");
            }
            return self::FAILURE;
        }

        try {
            DB::connection()->getPdo();
        } catch (Throwable $e) {
            $this->error('Database connection failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->info('Environment validated successfully.');
        return self::SUCCESS;
    }
}
