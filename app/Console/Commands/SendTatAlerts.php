<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Reception\Services\TatAlertDispatchService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendTatAlerts extends Command
{
    protected $signature = 'reception:send-tat-alerts {--force : Also run rules that already ran today}';

    protected $description = 'Notify users about acceptance items running out of TAT, per TAT alert rule';

    public function handle(TatAlertDispatchService $dispatchService): int
    {
        try {
            $sent = $dispatchService->run(now(), (bool) $this->option('force'));
            $this->info("Done. {$sent} TAT alert(s) sent.");

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Failed to send TAT alerts: {$e->getMessage()}");
            Log::error('reception:send-tat-alerts failed', ['exception' => $e]);

            return self::FAILURE;
        }
    }
}
