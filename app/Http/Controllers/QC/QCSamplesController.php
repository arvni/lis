<?php

namespace App\Http\Controllers\QC;

use App\Domains\Reception\Services\SampleService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class QCSamplesController extends Controller
{
    public function __construct(private SampleService $sampleService) {}

    public function __invoke(Request $request)
    {
        Gate::authorize('QC.Samples.List Samples');

        return Inertia::render('QC/Samples/Index', [
            'samples' => $this->sampleService->listPendingQcSamples(),
        ]);
    }
}
