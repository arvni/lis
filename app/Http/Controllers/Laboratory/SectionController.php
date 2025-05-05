<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\SectionDTO;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Requests\StoreSectionRequest;
use App\Domains\Laboratory\Requests\UpdateSectionRequest;
use App\Domains\Laboratory\Services\SectionService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function __construct(private readonly SectionService $sectionService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Section::class);
        $requestInputs = $request->all();
        $sections = $this->sectionService->listSections($requestInputs);
        return Inertia::render('Section/Index', compact("sections", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSectionRequest $sectionRequest)
    {
        $validatedData = $sectionRequest->validated();
        $sectionDto = new SectionDTO(
            $validatedData["name"],
            $validatedData["active"] ?? true,
            $validatedData["section_group"]["id"],
            $validatedData["description"]??"",
            $validatedData["icon"]??null
        );
        $this->sectionService->storeSection($sectionDto);
        return back()->with(["success" => true, "status" => "$sectionDto->name Created Successfully"]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Section $section, UpdateSectionRequest $request)
    {
        $validatedData = $request->validated();
        $sectionDto = new SectionDTO(
            $validatedData["name"],
            $validatedData["active"] ?? true,
            $validatedData["section_group"]["id"],
            $validatedData["description"]??"",
            $validatedData["icon"]??null
        );
        $this->sectionService->updateSection($section, $sectionDto);
        return back()->with(["success" => true, "status" => "$sectionDto->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(Section $section): RedirectResponse
    {
        $this->authorize("delete", $section);
        $title = $section["name"];
        $this->sectionService->deleteSection($section);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
