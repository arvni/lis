<?php

namespace App\Domains\Laboratory\Services;

use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\Laboratory\Repositories\ApprovalFlowRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ApprovalFlowService
{
    public function __construct(private ApprovalFlowRepository $approvalFlowRepository)
    {
    }

    public function listApprovalFlows($queryData): LengthAwarePaginator
    {
        return $this->approvalFlowRepository->listApprovalFlows($queryData);
    }

    public function storeApprovalFlow(array $data): ApprovalFlow
    {
        return DB::transaction(function () use ($data) {
            $approvalFlow = $this->approvalFlowRepository->createApprovalFlow(Arr::except($data, "steps"));
            $this->syncSteps($approvalFlow, $data["steps"]);
            return $approvalFlow;
        });
    }

    public function updateApprovalFlow(ApprovalFlow $approvalFlow, array $data): ApprovalFlow
    {
        return DB::transaction(function () use ($approvalFlow, $data) {
            $approvalFlow = $this->approvalFlowRepository->updateApprovalFlow($approvalFlow, Arr::except($data, "steps"));
            $this->syncSteps($approvalFlow, $data["steps"]);
            return $approvalFlow;
        });
    }

    /**
     * @throws Exception
     */
    public function deleteApprovalFlow(ApprovalFlow $approvalFlow): void
    {
        if ($approvalFlow->reportTemplates()->exists())
            throw new Exception("There are report templates that use this approval flow");
        $this->approvalFlowRepository->deleteApprovalFlow($approvalFlow);
    }

    /**
     * Replace the flow's steps with the submitted list, keeping existing rows
     * (matched by id) so report approvals keep pointing at their step.
     */
    private function syncSteps(ApprovalFlow $approvalFlow, array $steps): void
    {
        // Move existing rows out of the way so re-ordering can't trip the
        // unique (approval_flow_id, position) constraint mid-update.
        $approvalFlow->steps()->update(["position" => DB::raw("position + 1000")]);

        $keptIds = [];
        foreach (array_values($steps) as $index => $stepData) {
            $attributes = [
                "position" => $index + 1,
                "name" => $stepData["name"],
                "role_id" => $stepData["role_id"] ?? null,
                "user_id" => $stepData["user_id"] ?? null,
                "allow_self_approval" => $stepData["allow_self_approval"] ?? false,
            ];

            $step = isset($stepData["id"]) ? $approvalFlow->steps()->find($stepData["id"]) : null;
            if ($step)
                $step->update($attributes);
            else
                $step = $approvalFlow->steps()->create($attributes);
            $keptIds[] = $step->id;
        }

        $approvalFlow->steps()->whereNotIn("id", $keptIds)->delete();
    }
}
