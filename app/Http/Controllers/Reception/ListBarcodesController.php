<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;

class ListBarcodesController extends Controller
{
    public function __construct(private AcceptanceService $acceptanceService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Acceptance $acceptance)
    {
        $barcodes=$this->acceptanceService->listBarcodes($acceptance);
        return response()->json($barcodes);
    }
}
