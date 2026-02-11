<?php

namespace App\Domains\Reception\Listeners;

use App\Domains\Reception\DTOs\AcceptanceItemStateDTO;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Reception\Services\AcceptanceItemStateService;
use App\Domains\Reception\Services\AcceptanceService;
use App\Events\AcceptanceWithReferrerSampleCollected;

readonly class SampleCollectedListener
{
    /**
     * Create the event listener.
     */
    public function __construct(
        private AcceptanceService          $acceptanceService,
        private AcceptanceItemService      $acceptanceItemService,
        private AcceptanceItemStateService $acceptanceItemStateService,
    )
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $barcode = $event->barcode;
        $user = auth()->user();
        $acceptanceItem = $this->acceptanceItemService->findAcceptanceItemById($event->acceptanceItemId);
        $this->acceptanceItemService->updateAcceptanceItemTimeline($acceptanceItem, "Sample Collected By $user->name with Barcode $barcode");
        $acceptance = $this->acceptanceService->getAcceptanceById($acceptanceItem->acceptance_id);
        $newStatus = $acceptance->waiting_for_pooling
            ? AcceptanceStatus::POOLING
            : AcceptanceStatus::WAITING_FOR_ENTERING;
        $this->acceptanceService->updateAcceptanceStatus($acceptance, $newStatus);
        $hasState = $acceptanceItem->acceptanceItemStates()->where("sample_id", $event->sampleId)->exists();
        if ($acceptanceItem && !$hasState) {
            $acceptanceItem->load("method.workflow.firstSection");
            $firstSection = $acceptanceItem?->method?->workflow?->firstSection;
            if ($firstSection) {
                $this->acceptanceItemStateService->storeAcceptanceItemState(
                    new AcceptanceItemStateDTO(
                        $acceptanceItem->id,
                        $firstSection->id,
                        $firstSection->section_workflows_parameters,
                        AcceptanceItemStateStatus::WAITING,
                        $firstSection->section_workflows_order,
                        true,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        $event->sampleId
                    )
                );
            }
        }

        // Check if acceptance has referrer but no referrerOrder, then fire event
        if ($acceptance->referrer_id && !$acceptance->referrerOrder()->count()) {
            event(new AcceptanceWithReferrerSampleCollected($acceptance));
        }
    }
}
