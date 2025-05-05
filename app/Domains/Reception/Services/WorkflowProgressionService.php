<?php

namespace App\Domains\Reception\Services;

use App\Domains\Reception\DTOs\AcceptanceItemStateDTO;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Reception\Repositories\AcceptanceItemStateRepository;
use Carbon\Carbon;

readonly class WorkflowProgressionService
{
    public function __construct(
        private AcceptanceItemStateRepository $acceptanceItemStateRepository
    )
    {
    }

    /**
     * Progress the workflow for the given AcceptanceItem if possible.
     *
     * @param AcceptanceItem $acceptanceItem
     */
    public function progressWorkflow(AcceptanceItem $acceptanceItem): void
    {
        // Load necessary relationships
        $this->loadRequiredRelations($acceptanceItem);

        // Skip if conditions are not met
        if ($this->shouldSkipWorkflowProgression($acceptanceItem)) {
            return;
        }

        // Find active or last finished state
        $currentState = $this->getCurrentState($acceptanceItem);

        $countStates = $acceptanceItem->acceptanceItemStates()->count();

        // If no state found or currently processing, exit
        if ((!$currentState || $currentState->status === AcceptanceItemStateStatus::PROCESSING) && $countStates > 0) {
            return;
        }


        // Get next section in workflow
        $nextSection = $this->determineNextSection($acceptanceItem, $currentState);

        // Create new state if next section exists
        if ($nextSection) {
            $this->createNextWorkflowState($acceptanceItem, $nextSection);
        }
    }

    /**
     * Load all relationships needed for workflow processing
     */
    private function loadRequiredRelations(AcceptanceItem $acceptanceItem): void
    {
        $acceptanceItem->loadMissing(
            "acceptance",
            "workflow.sections",
            "acceptanceItemStates.section",
            "Report",
            "activeSample"
        );
    }

    /**
     * Determine if the acceptance item should skip workflow progression.
     */
    private function shouldSkipWorkflowProgression(AcceptanceItem $acceptanceItem): bool
    {

        if ($acceptanceItem->acceptance->status !== AcceptanceStatus::PROCESSING) {
            return true;
        }
        // Skip if report already exists
        if ($acceptanceItem->report) {
            return true;
        }

        // Skip if no workflow is defined
        if (!$acceptanceItem?->workflow) {
            return true;
        }

        // Skip if there's already a waiting state
        $waitingStatesCount = $acceptanceItem->acceptanceItemStates
            ->where("status", AcceptanceItemStateStatus::WAITING)
            ->count();

        if ($waitingStatesCount > 0)
            return true;

        return !$acceptanceItem->activeSample;
    }

    /**
     * Get the current state to work with (either active or last finished)
     */
    private function getCurrentState(AcceptanceItem $acceptanceItem): ?AcceptanceItemState
    {
        // First check for a processing state
        $processingState = $acceptanceItem->AcceptanceItemStates
            ->where("status", AcceptanceItemStateStatus::PROCESSING)
            ->first();

        if ($processingState) {
            return $processingState;
        }

        // Otherwise get the most recently finished state
        return $acceptanceItem->acceptanceItemStates
            ->whereIn("status", [AcceptanceItemStateStatus::FINISHED])
            ->sortByDesc("updated_at")
            ->first();
    }

    /**
     * Determine the next section in the workflow sequence
     */
    private function determineNextSection(AcceptanceItem $acceptanceItem, ?AcceptanceItemState $currentState): ?Section
    {
        $workflow = $acceptanceItem->workflow;

        if ($currentState) {
            $currentSection = $workflow->sections
                ->where("id", $currentState->section->id)
                ->first();

            if (!$currentSection) {
                return null;
            }

            return $workflow->sections
                ->where("pivot.order", $currentSection->pivot->order + 1)
                ->first();
        } else
            return $workflow->sections()
                ->wherePivot("order", 0)
                ->first();
    }

    /**
     * Create a new workflow state for the next section
     */
    private function createNextWorkflowState(AcceptanceItem $acceptanceItem, Section $nextSection): void
    {
        $userId = auth()->id();
        $now = Carbon::now();

        $acceptanceItemStateDTO = new AcceptanceItemStateDTO(
            acceptanceItemId: $acceptanceItem->id,
            sectionId: $nextSection->id,
            parameters: $nextSection->pivot["parameters"],
            status: AcceptanceItemStateStatus::PROCESSING,
            order: $nextSection->pivot["order"],
            isFirstSection: false,
            details: "",
            userId: $userId,
            startedById: $userId,
            finishedById: null,
            startedAt: $now,
            finishedAt: null,
        );

        $this->acceptanceItemStateRepository->creatAcceptanceItemState($acceptanceItemStateDTO->toArray());
    }
}
