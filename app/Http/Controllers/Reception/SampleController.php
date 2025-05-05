<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\DTOs\SampleDTO;
use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Requests\StoreSampleRequest;
use App\Domains\Reception\Requests\UpdateSampleRequest;
use App\Domains\Reception\Services\SampleService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SampleController extends Controller
{
    public function __construct(private SampleService $sampleService)
    {
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
            ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSampleRequest $request)
    {
        foreach ($request->validated("barcodes") as $barcode) {
            $this->sampleService->storeSample(SampleDTO::fromArray($barcode));
        }
        return redirect()->back()->with(["success" => true, "status" => "Sample created successfully."]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Sample $sample)
    {
        $sample->load([
            "patient",
            "acceptanceItems" => function ($q)  {
                $q->wherePivot("active", true);
                $q->with("test");
            }
        ]);
        return Inertia::render('Acceptance/Barcodes', ["barcodes" => [
            $sample
        ]]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSampleRequest $request, Sample $sample)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sample $sample)
    {
        //
    }
}
