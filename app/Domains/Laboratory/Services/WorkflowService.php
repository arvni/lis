<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\WorkflowDTO;
use App\Domains\Laboratory\Models\Workflow;
use App\Domains\Laboratory\Repositories\WorkflowRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WorkflowService
{
    public function __construct(private WorkflowRepository $workflowRepository)
    {
    }

    public function listWorkflows($queryData): LengthAwarePaginator
    {
        return $this->workflowRepository->ListWorkflows($queryData);
    }

    public function storeWorkflow(WorkflowDTO $workflowDTO): Workflow
    {
        return $this->workflowRepository->creatWorkflow($workflowDTO->toArray());
    }

    public function updateWorkflow(Workflow $workflow, WorkflowDTO $workflowDTO): Workflow
    {
        return $this->workflowRepository->updateWorkflow($workflow, $workflowDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteWorkflow(Workflow $workflow): void
    {
        if (!$workflow->methods()->exists()) {
            $this->workflowRepository->deleteWorkflow($workflow);
        } else
            throw new Exception("There is some Method that use this Workflow");
    }

    public function syncSectionWorkflows(Workflow $workflow, array $ids): void
    {
        $workflow->sectionWorkflows()->whereNotIn("section_workflows.id", $ids)->delete();
    }

    public function getPrevSections(Workflow $workflow,$order)
    {
        return $workflow->sections()
            ->wherePivot("order","<",$order)
            ->get();
    }
}
