<?php

namespace App\Domains\Reception\Services;


use App\Domains\Reception\Adapters\WorkflowAdapter;
use App\Domains\Reception\DTOs\AcceptanceItemStateDTO;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\AcceptanceItemStateRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

readonly class AcceptanceItemStateService
{
    public function __construct(
        private AcceptanceItemStateRepository $acceptanceItemStateRepository,
        private AcceptanceItemRepository      $acceptanceItemRepository,
        private WorkflowAdapter               $workflowAdapter,
        private AcceptanceItemService         $acceptanceItemService,
    )
    {
    }

    public function listAcceptanceItemStates(array $queryDate): LengthAwarePaginator
    {
        return $this->acceptanceItemStateRepository->listAcceptanceItemStates($queryDate);
    }

    public function storeAcceptanceItemState(AcceptanceItemStateDTO $acceptanceItemStateDTO): AcceptanceItemState
    {
        return $this->acceptanceItemStateRepository->creatAcceptanceItemState($acceptanceItemStateDTO->toArray());
    }

    public function showAcceptanceItemState(AcceptanceItemState $acceptanceItemState): AcceptanceItemState
    {
        $acceptanceItemState->load([
            "acceptanceItem.patients",
            "acceptanceItem.test",
            "acceptanceItem.method",
            "acceptanceItem.patients",
            "acceptanceItem.activeSample",
        ]);
        return $acceptanceItemState;
    }

    public function updateAcceptanceItemState(AcceptanceItemState $acceptanceItemState, AcceptanceItemStateDTO $acceptanceItemStateDTO): AcceptanceItemState
    {
        return $this->acceptanceItemStateRepository->updateAcceptanceItemState($acceptanceItemState, $acceptanceItemStateDTO->toArray());
    }

    public function findAcceptanceItemStateByBarcode($barcode): Collection
    {
        return $this->acceptanceItemStateRepository->findAcceptanceItemStateByBarcode($barcode);
    }

    public function deleteAcceptanceItemState(AcceptanceItemState $acceptanceItemState): void
    {
        $this->acceptanceItemStateRepository->deleteAcceptanceItemState($acceptanceItemState);
    }

    /**
     * Update parameters for an AcceptanceItemState.
     */
    public function updateParameters(
        AcceptanceItemState $acceptanceItemState,
        array               $parameters,
        string              $details,
        int                 $userId
    ): AcceptanceItemState
    {
        return $this->acceptanceItemStateRepository->updateAcceptanceItemState($acceptanceItemState, [
                "parameters" => $parameters,
                "details" => $details,
                "user_id" => $userId
            ]
        );
    }

    /**
     * Change status of an AcceptanceItemState and handle the subsequent workflow.
     */
    public function changeStatus(
        AcceptanceItemState       $acceptanceItemState,
        AcceptanceItemStateStatus $status,
        array                     $parameters,
        string                    $details,
        int                       $userId,
        ?int                      $nextSectionId = null
    ): AcceptanceItemState
    {
        $state = $this->acceptanceItemStateRepository->updateAcceptanceItemState(
            $acceptanceItemState, [
                "status" => $status,
                "parameters" => $parameters,
                "details" => $details,
                "finished_at" => now(),
                "finished_by_id" => $userId
            ]
        );

        // Handle workflow progression based on status
        if ($status === AcceptanceItemStateStatus::REJECTED) {
            $this->handleRejection($state, $nextSectionId);
        } elseif ($status === AcceptanceItemStateStatus::FINISHED) {
            $this->handleCompletion($state);
        }

        return $state;
    }

    public function getAcceptanceItemStatesStats($sectionId): Collection
    {
        return $this->acceptanceItemStateRepository->getAcceptanceItemStatesStats($sectionId);
    }

    /**
     * Handle the rejection workflow.
     */
    private function handleRejection(AcceptanceItemState $state, ?int $nextSectionOrder): void
    {
        $acceptanceItem = $this->acceptanceItemRepository->findAcceptanceItemById($state->acceptance_item_id);

        if (!is_null($nextSectionOrder)) {
            $section = $this->workflowAdapter->getSectionWorkflowByMethodTestAndOrder(
                $acceptanceItem->method_test_id,
                $nextSectionOrder,
            );
            if ($section) {
                $this->createNextState($acceptanceItem->id, $section);
            }
        } else {
            // Trigger rejection event
//            AcceptanceItemSampleRejectedEvent::dispatch($acceptanceItem);
            $this->acceptanceItemService->rejectSample($acceptanceItem);
        }
    }

    /**
     * Handle the completion workflow.
     */
    private function handleCompletion(AcceptanceItemState $state): void
    {
        $acceptanceItem = $this->acceptanceItemRepository->findAcceptanceItemById($state->acceptance_item_id);
        $nextSection = $this->workflowAdapter->getSectionWorkflowByMethodTestAndOrder(
            $acceptanceItem->method_test_id,
            $state->order + 1
        );

        if ($nextSection) {
            $this->createNextState($acceptanceItem->id, $nextSection);
        }
    }

    /**
     * Create the next state in the workflow.
     */
    private function createNextState(int $acceptanceItemId, object $section): void
    {
        $userId = auth()->id();

        $dto = new AcceptanceItemStateDTO(
            $acceptanceItemId,
            $section->section_id,
            $section->parameters,
            AcceptanceItemStateStatus::PROCESSING,
            $section->order,
            $section->order == 0,
            "",
            $userId,
            $userId,
            null,
            now(),
            null
        );

        $this->acceptanceItemStateRepository->creatAcceptanceItemState($dto->toArray());
    }

}
