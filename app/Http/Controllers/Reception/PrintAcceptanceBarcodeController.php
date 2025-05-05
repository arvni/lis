<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\SampleService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class PrintAcceptanceBarcodeController extends Controller
{
    public function __construct(private SampleService $sampleService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Acceptance $acceptance)
    {
        $barcodes=$this->sampleService->listSampleBarcodes(["acceptance_id" => $acceptance->id]);
        return Inertia::render("Acceptance/Barcodes", compact("barcodes"));
    }
}
