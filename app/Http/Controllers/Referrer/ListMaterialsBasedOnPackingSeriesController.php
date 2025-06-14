<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\Models\Material;
use App\Domains\Referrer\Services\MaterialService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ListMaterialsBasedOnPackingSeriesController extends Controller
{
    public function __construct(private readonly MaterialService $materialService)
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $this->authorize("viewAny", Material::class);
        $requestInputs = $request->all();
        $materials = $this->materialService->listPackingSeriesMaterials($requestInputs);
        return response()->json(compact("materials", "requestInputs"));
    }
}
