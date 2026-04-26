<?php

namespace App\Http\Controllers\QC;

use App\Domains\Reception\Models\Sample;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class QCSamplesController extends Controller
{
    public function __invoke(Request $request)
    {
        Gate::authorize('QC.Samples.List Samples');

        $samples = Sample::query()
            ->where('qc_status', 'pending')
            ->with([
                'sampler:id,name',
                'sampleType:id,name',
                'activeAcceptanceItems.acceptance:id,referenceCode',
                'activeAcceptanceItems.acceptance.patient:id,fullName,idNo',
                'activeAcceptanceItems.test' => fn($q) => $q->select('tests.id', 'tests.name'),
            ])
            ->latest()
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('QC/Samples/Index', [
            'samples' => $samples,
        ]);
    }
}
