<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\SampleTypeDTO;
use App\Domains\Laboratory\Events\SampleTypeUpdated;
use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Laboratory\Requests\StoreSampleTypeRequest;
use App\Domains\Laboratory\Requests\UpdateSampleTypeRequest;
use App\Domains\Laboratory\Services\SampleTypeService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SampleTypeController extends Controller
{
    public function __construct(private readonly SampleTypeService $sampleTypeService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", SampleType::class);
        $requestInputs = $request->all();
        $sampleTypes = $this->sampleTypeService->listSampleTypes($requestInputs);
        return Inertia::render('SampleType/Index', compact("sampleTypes", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSampleTypeRequest $sampleTypeRequest)
    {
        $validatedData = $sampleTypeRequest->validated();
        $sampleTypeDto = new SampleTypeDTO(
            $validatedData["name"],
            $validatedData["description"] ?? "",
            $validatedData["orderable"] ?? false,
            $validatedData["required_barcode"] ?? false,
        );
        $sampleType = $this->sampleTypeService->storeSampleType($sampleTypeDto);
        SampleTypeUpdated::dispatch($sampleType, "create");
        return back()->with(["success" => true, "status" => "$sampleTypeDto->name Created Successfully"]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(SampleType $sampleType, UpdateSampleTypeRequest $request)
    {
        $validatedData = $request->validated();
        $sampleTypeDto = new SampleTypeDTO(
            $validatedData["name"],
            $validatedData["description"] ?? "",
            $validatedData["orderable"] ?? false,
            $validatedData["required_barcode"] ?? false,
        );
        $updatedSampleType = $this->sampleTypeService->updateSampleType($sampleType, $sampleTypeDto);
        SampleTypeUpdated::dispatch($updatedSampleType, "update");
        return back()->with(["success" => true, "status" => "$sampleTypeDto->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(SampleType $sampleType): RedirectResponse
    {
        $this->authorize("delete", $sampleType);
        $title = $sampleType["name"];
        $this->sampleTypeService->deleteSampleType($sampleType);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
