<?php

namespace App\Http\Controllers\Referrer\Api;

use App\Domains\Referrer\Models\Material;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CheckMaterialForReferrerController extends Controller
{
    public function __invoke(Request $request)
    {
        $barcode      = $request->input('barcode');
        $sampleTypeId = $request->input('sample_type_id');
        $referrerId   = $request->input('referrer_id');

        $material = Material::query()
            ->where('barcode', $barcode)
            ->where('sample_type_id', $sampleTypeId)
            ->whereHas('referrer', fn($q) => $q->where('referrers.id', $referrerId))
            ->first();

        if (!$material) {
            return response()->json(['message' => 'Material not available or does not belong to this referrer'], 404);
        }

        return response()->json([
            'material' => [
                'id'      => $material->id,
                'barcode' => $material->barcode,
            ],
        ]);
    }
}
