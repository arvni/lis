<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\DTOs\SampleDTO;
use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Requests\StoreSampleRequest;
use App\Domains\Reception\Requests\UpdateSampleRequest;
use App\Domains\Reception\Services\SampleService;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SampleController extends Controller
{
    public function __construct(
        private SampleService $sampleService,
        private ReferrerOrderService $referrerOrderService,
    ) {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Sample::class);
        $requestInputs = $request->all();

        $samples = $this->sampleService->listSamples($requestInputs);
        return Inertia::render('Sample/Index',
            [
                "samples" => $samples,
                "requestInputs" => $requestInputs,
                "canEdit" => Gate::allows("update", Sample::class),
            ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSampleRequest $request): \Illuminate\Http\RedirectResponse
    {
        $barcodes = $request->validated('barcodes', []);
        $collectRequestId = $request->validated('collect_request.id');
        $collectRequestId = $collectRequestId ? (int) $collectRequestId : null;

        foreach ($barcodes as $key => $barcode) {
            $barcode['collect_request_id'] = $collectRequestId;
            $this->sampleService->storeSample(SampleDTO::fromArray($barcode), $key);
        }

        $firstItemId = data_get($barcodes, '0.items.0.id');
        $acceptance  = $this->sampleService->resolveAcceptanceForItem($firstItemId ? (int) $firstItemId : null);

        if ($acceptance) {
            // Pooling acceptances update their existing order (carrying the
            // collect request) instead of spawning a new referrer order.
            if ($acceptance->waiting_for_pooling) {
                $this->referrerOrderService->updateExistingOrderForPooling($acceptance, $collectRequestId);
            } elseif ($acceptance->referrer_id) {
                $this->referrerOrderService->createOrUpdateFromBarcodes(
                    $barcodes,
                    $acceptance,
                    $collectRequestId,
                );
            }
        }

        return redirect()->back()->with(["success" => true, "status" => "Sample created successfully."]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Sample $sample): \Inertia\Response
    {
        return Inertia::render('Acceptance/Barcodes', ["barcodes" => [
            $this->sampleService->loadForBarcodeView($sample),
        ]]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSampleRequest $request, Sample $sample): \Illuminate\Http\RedirectResponse
    {
        $this->sampleService->updateBarcode($sample, $request->validated('barcode'));

        return redirect()->back()->with(["success" => true, "status" => "Sample barcode updated successfully."]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sample $sample)
    {
        //
    }
}
