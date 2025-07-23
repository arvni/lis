<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Reception\DTOs\SampleDTO;
use App\Domains\Reception\Services\SampleService;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Services\MaterialService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReferrerOrderSamplesRequest;
use Illuminate\Http\RedirectResponse;

class StoreReferrerOrderSamplesController extends Controller
{
    public function __construct(
        private readonly SampleService   $sampleService,
        private readonly MaterialService $materialService,
    )
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(ReferrerOrder $referrerOrder, StoreReferrerOrderSamplesRequest $request): RedirectResponse
    {
        if (!$referrerOrder->acceptance_id)
            return back()->withErrors(["This Order Must be Accepted"]);
        $referrerOrder->load(["acceptance" => fn($q) => $q->withCount("samples")]);
        if ($referrerOrder->acceptance->samples_count)
            return back()->withErrors(["This Order Sampled Before"]);
        foreach ($request->validated("barcodes") as $key => $barcode) {
            $material = $this->materialService->getMaterialByBarcode(strtoupper($barcode["barcode"]));
            if ($material) {
                $material->load("referrer");
                if ($material->referrer->id == $referrerOrder->referrer->id && !$material->sample_id)
                    $barcode["material"] = $material->toArray();
            }
            $this->sampleService->storeSample(SampleDTO::fromArray($barcode), $key);
        }
        return redirect()->back()->with(["success" => true, "status" => "Sample created successfully."]);
    }
}
