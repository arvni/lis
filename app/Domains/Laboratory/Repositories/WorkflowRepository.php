<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\Workflow;
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
        return Workflow::query()->create($workflowData);
    }

    public function updateWorkflow(Workflow $workflow, array $workflowData): Workflow
    {
        $workflow->fill($workflowData);
        if ($workflow->isDirty())
            $workflow->save();
        return $workflow;
    }

    public function deleteWorkflow(Workflow $workflow): void
    {
        $workflow->delete();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }

}
