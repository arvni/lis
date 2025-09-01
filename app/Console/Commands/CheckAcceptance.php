<?php

namespace App\Console\Commands;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;

class CheckAcceptance extends Command
{

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'acceptance:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        Acceptance::withoutEvents(function () {
            Acceptance::query()
                ->whereIn("status", [AcceptanceStatus::WAITING_FOR_ENTERING->value, AcceptanceStatus::WAITING_FOR_PAYMENT->value])
                ->chunk(100, function ($acceptances) {
                    $acceptanceService = resolve(AcceptanceService::class);
                    foreach ($acceptances as $acceptance) {
                        $acceptanceService->checkAcceptanceStatus($acceptance);
                    }
                });
        });
    }
}
