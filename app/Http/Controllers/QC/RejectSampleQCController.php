<?php

namespace App\Http\Controllers\QC;

use App\Domains\Reception\Models\Sample;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RejectSampleQCController extends Controller
{
    public function __invoke(Request $request, Sample $sample)
    {
        Gate::authorize('QC.Samples.Approve Sample');

        if ($sample->qc_status !== 'pending') {
            return redirect()->back()->with('status', 'Sample is not pending QC.');
        }

        $sample->update([
            'qc_status'         => 'rejected',
            'qc_approved_by_id' => auth()->id(),
            'qc_approved_at'    => now(),
        ]);

        return redirect()->back()->with(['success' => true, 'status' => 'Sample QC rejected.']);
    }
}
