<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\SectionWorkflowDTO;
use App\Domains\Laboratory\DTOs\WorkflowDTO;
use App\Domains\Laboratory\Models\Workflow;
use App\Domains\Laboratory\Requests\StoreWorkflowRequest;
use App\Domains\Laboratory\Requests\UpdateWorkflowRequest;
use App\Domains\Laboratory\Services\SectionWorkflowService;
use App\Domains\Laboratory\Services\WorkflowService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowController extends Controller
{
    public function __construct(private WorkflowService $workflowService,
                                private SectionWorkflowService $sectionWorkflowService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Workflow::class);
        $requestInputs = $request->all();
        $workflows = $this->workflowService->listWorkflows($requestInputs);
        return Inertia::render('Workflow/Index', compact("workflows", "requestInputs"));
    }

    /**
     * @throws AuthorizationException
     */
    public function create(): Response
    {
        $this->authorize("create", Workflow::class);
        return Inertia::render('Workflow/Add');
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreWorkflowRequest $workflowRequest)
    {
        $validatedData = $workflowRequest->validated();
        $workflowDto = new WorkflowDTO(
            $validatedData["name"],
            $validatedData["description"] ?? "",
            $validatedData["status"]??true,
        );
        $workflow = $this->workflowService->storeWorkflow($workflowDto);

        foreach ($validatedData["section_workflows"] as $key => $store_workflow) {
            $workflowWorkflowDto = new SectionWorkflowDTO(
                $store_workflow["section"]["id"],
                $workflow->id,
                $store_workflow["parameters"],
                $key,
            );
            $this->sectionWorkflowService->storeSectionWorkflow($workflowWorkflowDto);
        }
        return redirect()->route("workflows.index")
            ->with(["success" => true, "status" => "$workflowDto->name Created Successfully"]);
    }


    /**
     * edit a created resource in storage.
     * @throws AuthorizationException
     */
    public function edit(Workflow $workflow): Response
    {
        $this->authorize("update", $workflow);
        $workflow->load("sectionWorkflows.section:name,id");
        return Inertia::render('Workflow/Edit', compact("workflow"));
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Workflow $workflow, UpdateWorkflowRequest $request): RedirectResponse
    {
        $validatedData = $request->validated();
        $workflowDto = new WorkflowDTO(
            $validatedData["name"],
            $validatedData["description"] ?? "",
            $validatedData["status"]??true,
        );
        $this->workflowService->updateWorkflow($workflow, $workflowDto);
        $ids=[];
        foreach ($validatedData["section_workflows"] as $key=> $sectionWorkflow) {
            $sectionWorkflowDto = new SectionWorkflowDTO(
                $sectionWorkflow["section"]["id"],
                $workflow->id,
                $sectionWorkflow["parameters"],
                $key,
            );
            $sectionWorkflow = null;
            if (isset($sectionWorkflow["id"]))
                $sectionWorkflow = $this->sectionWorkflowService->findSectionWorkflowById($sectionWorkflow["id"]);
            if ($sectionWorkflow)
                $this->sectionWorkflowService->updateSectionWorkflow($sectionWorkflow, $sectionWorkflowDto);
            else
                $sectionWorkflow=$this->sectionWorkflowService->storeSectionWorkflow($sectionWorkflowDto);
            $ids[]=$sectionWorkflow->id;
        }
        $this->workflowService->syncSectionWorkflows($workflow,$ids);

        return redirect()->route("workflows.index")
            ->with(["success" => true, "status" => "$workflowDto->name updated Successfully"]);
    }

    /**`
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(Workflow $workflow): RedirectResponse
    {
        $this->authorize("delete", $workflow);
        $title = $workflow["name"];
        $this->workflowService->deleteWorkflow($workflow);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
