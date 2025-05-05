<?php

namespace App\Domains\Reception\Adapters;

use App\Domains\Laboratory\Models\SectionWorkflow;
use App\Domains\Laboratory\Repositories\SectionWorkflowRepository;
use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Database\Eloquent\Collection;

/**
 * This adapter provides a way for the Reception domain to access
 * the Workflow domain without direct coupling.
 */
readonly class WorkflowAdapter
{
    public function __construct(
        private SectionWorkflowRepository $sectionWorkflowRepository
    )
    {
    }

    /**
     * Get the workflow section by ID for a specific acceptance item.
     */
    public function getSectionWorkflow($method_id, int $sectionId): ?object
    {
        return $this->sectionWorkflowRepository->findBySectionByMethodTestId(
            $sectionId,
            $method_id
        );
    }

    public function getSectionWorkflowByMethodTestAndOrder($method_id, $order): ?object
    {
        return $this->sectionWorkflowRepository->findByOrderByMethodTestId(
            $method_id,
            $order
        );
    }

    public function getPrevSections($method_id, $order): Collection
    {
        return $this->sectionWorkflowRepository->getPrevSections(
            $method_id,
            $order
        );
    }


}
