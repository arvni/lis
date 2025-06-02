<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\SectionGroupDTO;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Requests\StoreSectionGroupRequest;
use App\Domains\Laboratory\Requests\UpdateSectionGroupRequest;
use App\Domains\Laboratory\Services\SectionGroupService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SectionGroupController extends Controller
{
    public function __construct(private SectionGroupService $sectionGroupService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", SectionGroup::class);
        $requestInputs = $request->all();
        $sectionGroups = $this->sectionGroupService->listSectionGroups($requestInputs);
        return Inertia::render('SectionGroup/Index', compact("sectionGroups", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSectionGroupRequest $sectionGroupRequest)
    {
        $validatedData = $sectionGroupRequest->validated();
        $sectionGroupDto = new SectionGroupDTO(
            $validatedData["name"],
            $validatedData["active"] ?? true,
            $validatedData["parent"]["id"] ?? null
        );
        $this->sectionGroupService->storeSectionGroup($sectionGroupDto);
        return back()->with(["success" => true, "status" => "$sectionGroupDto->name Created Successfully"]);
    }


    public function show(SectionGroup $sectionGroup)
    {
        $this->authorize("view", $sectionGroup);
        $this->sectionGroupService->getSectionGroupWithChildrenAndSection($sectionGroup);
        return Inertia::render('SectionGroup/Show', compact("sectionGroup"));
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(SectionGroup $sectionGroup, UpdateSectionGroupRequest $request)
    {
        $validatedData = $request->validated();
        $sectionGroupDto = new SectionGroupDTO(
            $validatedData["name"],
            $validatedData["active"] ?? true,
            $validatedData["parent"]["id"] ?? null
        );
        $this->sectionGroupService->updateSectionGroup($sectionGroup, $sectionGroupDto);
        return back()->with(["success" => true, "status" => "$sectionGroupDto->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(SectionGroup $sectionGroup): RedirectResponse
    {
        $this->authorize("delete", $sectionGroup);
        $title = $sectionGroup["name"];
        $this->sectionGroupService->deleteSectionGroup($sectionGroup);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
