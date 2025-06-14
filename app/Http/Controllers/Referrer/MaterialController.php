<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\DTOs\GroupMaterialDTO;
use App\Domains\Referrer\DTOs\MaterialDTO;
use App\Domains\Referrer\Models\Material;
use App\Domains\Referrer\Requests\StoreMaterialRequest;
use App\Domains\Referrer\Requests\UpdateMaterialRequest;
use App\Domains\Referrer\Services\MaterialService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaterialController extends Controller
{
    public function __construct(private readonly MaterialService $materialService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Material::class);
        $requestInputs = $request->all();
        $materials = $this->materialService->listMaterials($requestInputs);
        return Inertia::render('Materials/Index', compact("materials", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMaterialRequest $materialRequest): RedirectResponse
    {
        $validatedData = $materialRequest->validated();
        $materialDto = GroupMaterialDTO::fromArray([
            "sample_type_id" => $validatedData["sample_type"]["id"],
            "tubes" => $validatedData["tubes"]
        ]);
        $packingSeries = $this->materialService->storeMaterial($materialDto);

        return redirect()->route("materials.packing-series.print",$packingSeries);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Material $material, UpdateMaterialRequest $request)
    {
        $validatedData = $request->validated();
        $materialDto = MaterialDTO::fromArray($validatedData);
        $this->materialService->updateMaterial($material, $materialDto);
        return back()->with(["success" => true, "status" => "Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(Material $material): RedirectResponse
    {
        $this->authorize("delete", $material);
        $title = $material["name"];
        $this->materialService->deleteMaterial($material);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
