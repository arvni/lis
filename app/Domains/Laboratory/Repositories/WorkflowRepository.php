<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\Workflow;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WorkflowRepository
{
    public function listWorkflows(array $queryData): LengthAwarePaginator
    {
        $query = Workflow::withCount(["methods"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatWorkflow(array $workflowData): Workflow
    {
        $workflow= Workflow::query()->create($workflowData);
        UserActivityService::createUserActivity($workflow,ActivityType::CREATE);
        return $workflow;
    }

    public function updateWorkflow(Workflow $workflow, array $workflowData): Workflow
    {
        $workflow->fill($workflowData);
        if ($workflow->isDirty()) {
            $workflow->save();
            UserActivityService::createUserActivity($workflow,ActivityType::UPDATE);
        }
        return $workflow;
    }

    public function deleteWorkflow(Workflow $workflow): void
    {
        $workflow->delete();
        UserActivityService::createUserActivity($workflow,ActivityType::DELETE);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

}
