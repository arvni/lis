<?php

namespace App\Domains\Reception\Listeners;

use App\Domains\Reception\DTOs\AcceptanceItemDTO;
use App\Domains\Reception\DTOs\AcceptanceItemStateDTO;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Reception\Services\AcceptanceItemStateService;
use App\Domains\Reception\Services\AcceptanceService;

readonly class SampleCollectedListener
{
    /**
     * Create the event listener.
     */
    public function __construct(
        private AcceptanceService      $acceptanceService,
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
        $barcode=$event->barcode;
        $user=auth()->user();
        $acceptanceItem = $this->acceptanceItemService->findAcceptanceItemById($event->acceptanceItemId);
        $this->acceptanceItemService->updateAcceptanceItemTimeline($acceptanceItem, "Sample Collected By $user->name with Barcode $barcode");
        $acceptance=$this->acceptanceService->getAcceptanceById($acceptanceItem->acceptance_id);
        $this->acceptanceService->updateAcceptanceStatus($acceptance, AcceptanceStatus::WAITING_FOR_ENTERING);

        if ($acceptanceItem) {
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
                    )
                );
            }
        }
    }
}
