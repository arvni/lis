<?php

namespace App\Domains\Reception\Services;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Reception\DTOs\AcceptanceItemStateDTO;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Exceptions\SampleNotFoundException;
use App\Domains\Reception\Exceptions\SampleNotWaitingException;
use App\Domains\Reception\Models\AcceptanceItemState;

readonly class SampleEntryService
{
    public function __construct(
        private AcceptanceItemStateService $acceptanceItemStateService,
        private AcceptanceItemService      $acceptanceItemService,
        private AcceptanceService          $acceptanceService
    ) {
    }

    /**
     * Process a sample entry into a laboratory section
     *
     * @param string $barcode The sample barcode
     * @param Section $section The laboratory section
     * @param int $userId The current user ID
     * @param string $userName The current username
     * @throws SampleNotFoundException If no sample is found with the given barcode
     * @throws SampleNotWaitingException If no waiting sample is found with the given barcode
     */
    public function processSampleEntry(string $barcode, Section $section, int $userId, string $userName): void
    {
        $acceptanceItemStates = $this->acceptanceItemStateService->findAcceptanceItemStateByBarcode($barcode);

        if (!count($acceptanceItemStates)) {
            throw new SampleNotFoundException("Sample not found");
        }

        $processed = false;

        foreach ($acceptanceItemStates as $acceptanceItemState) {
            if ($acceptanceItemState->status === AcceptanceItemStateStatus::WAITING) {
                $this->processSingleSample($acceptanceItemState, $userId, $userName);
                $processed = true;
            }
        }

        if (!$processed) {
            throw new SampleNotWaitingException("Sample not found in waiting status");
        }
    }

    /**
     * Process a single sample state
     */
    private function processSingleSample(AcceptanceItemState $acceptanceItemState, int $userId, string $userName): void
    {
        // Create DTO from the state and update it
        $acceptanceItemStateDTO = AcceptanceItemStateDTO::fromAcceptanceItemState($acceptanceItemState);
        $acceptanceItemStateDTO->startedAt = now();
        $acceptanceItemStateDTO->startedById = $userId;
        $acceptanceItemStateDTO->status = AcceptanceItemStateStatus::PROCESSING;

        // Update the state
        $this->acceptanceItemStateService->updateAcceptanceItemState(
            $acceptanceItemState,
            $acceptanceItemStateDTO
        );

        // Update acceptance item timeline
        $acceptanceItem = $this->acceptanceItemService->findAcceptanceItemById(
            $acceptanceItemState->acceptance_item_id
        );

        $this->acceptanceItemService->updateAcceptanceItemTimeline(
            $acceptanceItem,
            "Process Started By " . $userName
        );

        // Update parent acceptance status
        $acceptance = $this->acceptanceService->getAcceptanceById(
            $acceptanceItem->acceptance_id
        );

        $this->acceptanceService->updateAcceptanceStatus(
            $acceptance,
            AcceptanceStatus::PROCESSING
        );
    }
}
