<?php

namespace App\Domains\Laboratory\Repositories;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\Workflow;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WorkflowRepository
{
    use LogsUserActivity;

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
        $this->logCreated($workflow);
        return $workflow;
    }

    public function updateWorkflow(Workflow $workflow, array $workflowData): Workflow
    {
        $workflow->fill($workflowData);
        if ($workflow->isDirty()) {
            $workflow->save();
            $this->logUpdated($workflow);
        }
        return $workflow;
    }

    public function deleteWorkflow(Workflow $workflow): void
    {
        $workflow->delete();
        $this->logDeleted($workflow);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Laboratory\Models\Workflow>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

}
