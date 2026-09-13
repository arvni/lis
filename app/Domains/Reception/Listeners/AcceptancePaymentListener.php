<?php

declare(strict_types=1);

namespace App\Domains\Reception\Listeners;

use App\Domains\Reception\Services\AcceptanceService;

class AcceptancePaymentListener
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
        $acceptance = $this->acceptanceService->getAcceptanceById($event->acceptanceId);
        if ($acceptance) {
            $this->acceptanceService->handlePaymentReceived($acceptance);
        }
    }
}
