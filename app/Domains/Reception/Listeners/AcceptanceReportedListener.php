<?php

namespace App\Domains\Reception\Listeners;

use App\Domains\Reception\Services\AcceptanceService;

class AcceptanceReportedListener
{
    /**
     * Create the event listener.
     */
    public function __construct(protected AcceptanceService $acceptanceService)
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $acceptance = $event->acceptance;
        $silent=$event->silent??false;
        $this->acceptanceService->checkAcceptanceReport($acceptance,$silent);
    }
}
