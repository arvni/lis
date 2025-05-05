<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Services\WorkflowProgressionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class CheckAcceptanceItemWorkflowController extends Controller
{
    public function __construct(private readonly WorkflowProgressionService $workflowProgressionService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(AcceptanceItem $acceptanceItem): RedirectResponse
    {
        $this->workflowProgressionService->progressWorkflow($acceptanceItem);
        return back()->with(["success"=>true,"status"=> "Workflow progress checked"]);
    }
}
