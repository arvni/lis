<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\SectionWorkflowDTO;
use App\Domains\Laboratory\Models\SectionWorkflow;
use App\Domains\Laboratory\Repositories\SectionWorkflowRepository;
use Exception;

class SectionWorkflowService
{
    public function __construct(private SectionWorkflowRepository $sectionWorkflowRepository)
    {
    }

    public function storeSectionWorkflow(SectionWorkflowDTO $sectionWorkflowDTO): SectionWorkflow
    {
        return $this->sectionWorkflowRepository->creatSectionWorkflow($sectionWorkflowDTO->toArray());
    }

    public function updateSectionWorkflow(SectionWorkflow $sectionWorkflow, SectionWorkflowDTO $sectionWorkflowDTO): SectionWorkflow
    {
        return $this->sectionWorkflowRepository->updateSectionWorkflow($sectionWorkflow, $sectionWorkflowDTO->toArray());
    }

    public function findSectionWorkflowById($id): ?SectionWorkflow
    {
        return $this->sectionWorkflowRepository->findSectionWorkflowById($id);
    }
    public function deleteSectionWorkflow(SectionWorkflow $sectionWorkflow): void
    {
        $this->sectionWorkflowRepository->deleteSectionWorkflow($sectionWorkflow);
    }

}
