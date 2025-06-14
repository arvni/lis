<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\Models\OrderMaterial;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class PrintOrderMaterialController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(OrderMaterial $orderMaterial)
    {
        $orderMaterial->load(["materials" => fn($q) => $q->withAggregate("sampleType", "name")]);
        return Inertia::render("Materials/Barcodes", ["materials" => $orderMaterial->materials]);
    }
}
