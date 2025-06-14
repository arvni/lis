<?php

namespace App\Http\Controllers\Referrer\Api;

use App\Domains\Referrer\Services\MaterialService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CheckMaterialBarcodeIsAvailableController extends Controller
{
    public function __construct(private readonly MaterialService $materialService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $barcode = $request->input('barcode');
        $sampleId = $request->input('sample_id');
        if ($this->materialService->isBarcodeAvailableToAssign($barcode,$sampleId)) {
            $material = $this->materialService->getMaterialByBarcode($barcode);
            return response()->json(["material" => ["id" => $material->id, "barcode" => $material->barcode]]);
        } else
            return response()->json(["message" => "Barcode Not Available"], 404);
    }
}
