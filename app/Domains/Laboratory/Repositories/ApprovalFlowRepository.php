<?php

namespace App\Domains\Laboratory\Repositories;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ApprovalFlowRepository
{
    use LogsUserActivity;

    public function listApprovalFlows(array $queryData): LengthAwarePaginator
    {
        $query = ApprovalFlow::withCount(["steps", "reportTemplates"])
            ->with("steps.role:id,name", "steps.user:id,name");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function createApprovalFlow(array $data): ApprovalFlow
    {
        $approvalFlow = ApprovalFlow::query()->create($data);
        $this->logCreated($approvalFlow);
        return $approvalFlow;
    }

    public function updateApprovalFlow(ApprovalFlow $approvalFlow, array $data): ApprovalFlow
    {
        $approvalFlow->fill($data);
        if ($approvalFlow->isDirty()) {
            $approvalFlow->save();
            $this->logUpdated($approvalFlow);
        }
        return $approvalFlow;
    }

    public function deleteApprovalFlow(ApprovalFlow $approvalFlow): void
    {
        $approvalFlow->delete();
        $this->logDeleted($approvalFlow);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Laboratory\Models\ApprovalFlow>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
    }
}
