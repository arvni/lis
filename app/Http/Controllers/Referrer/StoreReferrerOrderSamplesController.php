<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Reception\DTOs\SampleDTO;
use App\Domains\Reception\Services\SampleService;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReferrerOrderSamplesRequest;
use Illuminate\Http\RedirectResponse;

class StoreReferrerOrderSamplesController extends Controller
{
    public function __construct(private SampleService $sampleService)
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
        foreach ($request->validated("barcodes") as $barcode) {
            $this->sampleService->storeSample(SampleDTO::fromArray($barcode));
        }
        return redirect()->back()->with(["success" => true, "status" => "Sample created successfully."]);
    }
}
