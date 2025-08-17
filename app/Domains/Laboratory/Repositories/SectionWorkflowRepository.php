<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\SectionWorkflow;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Database\Eloquent\Collection;

class SectionWorkflowRepository
{

    public function creatSectionWorkflow(array $workflowData): SectionWorkflow
    {
        $workflow= SectionWorkflow::query()->create($workflowData);
        UserActivityService::createUserActivity($workflow,ActivityType::CREATE);
        return $workflow;
    }

    public function updateSectionWorkflow(SectionWorkflow $workflow, array $workflowData): SectionWorkflow
    {
        $workflow->fill($workflowData);
        if ($workflow->isDirty()) {
            $workflow->save();
            UserActivityService::createUserActivity($workflow,ActivityType::UPDATE);
        }
        return $workflow;
    }

    public function deleteSectionWorkflow(SectionWorkflow $workflow): void
    {
        $workflow->delete();
        UserActivityService::createUserActivity($workflow,ActivityType::DELETE);
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
