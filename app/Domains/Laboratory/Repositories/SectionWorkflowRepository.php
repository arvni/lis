<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\SectionWorkflow;
use Illuminate\Database\Eloquent\Collection;

class SectionWorkflowRepository
{
    use LogsUserActivity;


    public function creatSectionWorkflow(array $workflowData): SectionWorkflow
    {
        $workflow= SectionWorkflow::query()->create($workflowData);
        $this->logCreated($workflow);
        return $workflow;
    }

    public function updateSectionWorkflow(SectionWorkflow $workflow, array $workflowData): SectionWorkflow
    {
        $workflow->fill($workflowData);
        if ($workflow->isDirty()) {
            $workflow->save();
            $this->logUpdated($workflow);
        }
        return $workflow;
    }

    public function deleteSectionWorkflow(SectionWorkflow $workflow): void
    {
        $workflow->delete();
        $this->logDeleted($workflow);
    }

    public function findSectionWorkflowById($id): ?SectionWorkflow
    {
        return SectionWorkflow::find($id);
    }

    public function findBySectionByMethodTestId($methodId, $sectionId): ?SectionWorkflow
    {
        return SectionWorkflow::query()
            ->whereHas("workflow", function ($query) use ($methodId) {
                $query->whereHas("methods", function ($query) use ($methodId) {
                    $query->whereHas("methodTests", fn($q) => $q->where("method_tests.id", $methodId));
                });
            })
            ->where("section_id", $sectionId)
            ->first();
    }

    public function findByOrderByMethodTestId($methodId, $order): ?SectionWorkflow
    {
        return SectionWorkflow::query()
            ->whereHas("workflow", function ($query) use ($methodId) {
                $query->whereHas("methods", function ($query) use ($methodId) {
                    $query->whereHas("methodTests", fn($q) => $q->where("method_tests.id", $methodId));
                });
            })
            ->where("order", $order)
            ->first();
    }

    public function getPrevSections($methodId, $order): ?Collection
    {
        return SectionWorkflow::query()
            ->whereHas("workflow", function ($query) use ($methodId) {
                $query->whereHas("methods", function ($query) use ($methodId) {
                    $query->whereHas("methodTests", fn($q) => $q->where("method_tests.id", $methodId));
                });
            })
            ->where("order", "<", $order)
            ->withAggregate("section","name")
            ->get();
    }

}
