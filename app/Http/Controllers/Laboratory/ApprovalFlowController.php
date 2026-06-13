<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\Laboratory\Requests\StoreApprovalFlowRequest;
use App\Domains\Laboratory\Requests\UpdateApprovalFlowRequest;
use App\Domains\Laboratory\Services\ApprovalFlowService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalFlowController extends Controller
{
    public function __construct(private readonly ApprovalFlowService $approvalFlowService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", ApprovalFlow::class);
        $requestInputs = $request->all();
        $approvalFlows = $this->approvalFlowService->listApprovalFlows($requestInputs);
        return Inertia::render('ApprovalFlow/Index', compact("approvalFlows", "requestInputs"));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreApprovalFlowRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $approvalFlow = $this->approvalFlowService->storeApprovalFlow($validated);
        return redirect()->route("approvalFlows.index")
            ->with(["success" => true, "status" => "$approvalFlow->name Created Successfully"]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ApprovalFlow $approvalFlow, UpdateApprovalFlowRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $approvalFlow = $this->approvalFlowService->updateApprovalFlow($approvalFlow, $validated);
        return redirect()->route("approvalFlows.index")
            ->with(["success" => true, "status" => "$approvalFlow->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws AuthorizationException
     */
    public function destroy(ApprovalFlow $approvalFlow): RedirectResponse
    {
        $this->authorize("delete", $approvalFlow);
        $title = $approvalFlow->name;
        try {
            $this->approvalFlowService->deleteApprovalFlow($approvalFlow);
        } catch (Exception $e) {
            return back()->withErrors($e->getMessage());
        }
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
