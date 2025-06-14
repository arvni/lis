<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\Services\MaterialService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class PrintMaterialsBarcodeController extends Controller
{
    public function __construct(private readonly MaterialService $materialService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(string $packingSeries)
    {
        $materials = $this->materialService->getMaterialsByPackingSeries($packingSeries);
        return Inertia::render("Materials/Barcodes", ["materials" => $materials]);
    }
}
