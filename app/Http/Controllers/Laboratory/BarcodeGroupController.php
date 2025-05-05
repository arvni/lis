<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\BarcodeGroupDTO;
use App\Domains\Laboratory\Models\BarcodeGroup;
use App\Domains\Laboratory\Requests\StoreBarcodeGroupRequest;
use App\Domains\Laboratory\Requests\UpdateBarcodeGroupRequest;
use App\Domains\Laboratory\Services\BarcodeGroupService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BarcodeGroupController extends Controller
{
    public function __construct(private BarcodeGroupService $barcodeGroupService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", BarcodeGroup::class);
        $requestInputs = $request->all();
        $barcodeGroups = $this->barcodeGroupService->listBarcodeGroups($requestInputs);
        return Inertia::render('BarcodeGroup/Index', compact("barcodeGroups", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBarcodeGroupRequest $barcodeGroupRequest)
    {
        $validatedData = $barcodeGroupRequest->validated();
        $barcodeGroupDto = new BarcodeGroupDTO(
            $validatedData["name"],
            $validatedData["abbr"]
        );
        $this->barcodeGroupService->storeBarcodeGroup($barcodeGroupDto);
        return back()->with(["success" => true, "status" => "$barcodeGroupDto->name Created Successfully"]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(BarcodeGroup $barcodeGroup, UpdateBarcodeGroupRequest $request)
    {
        $validatedData = $request->validated();
        $barcodeGroupDto = new BarcodeGroupDTO(
            $validatedData["name"],
            $validatedData["abbr"]
        );
        $this->barcodeGroupService->updateBarcodeGroup($barcodeGroup, $barcodeGroupDto);
        return back()->with(["success" => true, "status" => "$barcodeGroupDto->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(BarcodeGroup $barcodeGroup): RedirectResponse
    {
        $this->authorize("delete", $barcodeGroup);
        $title = $barcodeGroup["name"];
        $this->barcodeGroupService->deleteBarcodeGroup($barcodeGroup);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
