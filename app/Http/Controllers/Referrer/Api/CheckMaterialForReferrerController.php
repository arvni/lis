<?php

namespace App\Http\Controllers\Referrer\Api;

use App\Domains\Referrer\Repositories\MaterialRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CheckMaterialForReferrerController extends Controller
{
    public function __construct(private MaterialRepository $materials) {}

    public function __invoke(Request $request)
    {
        $material = $this->materials->findForReferrer(
            (string) $request->input('barcode'),
            $request->integer('sample_type_id'),
            $request->integer('referrer_id'),
        );

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
