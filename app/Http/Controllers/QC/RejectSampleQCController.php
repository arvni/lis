<?php

namespace App\Http\Controllers\QC;

use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RejectSampleQCController extends Controller
{
    public function __invoke(Request $request, Sample $sample, AcceptanceItemService $acceptanceItemService): \Illuminate\Http\RedirectResponse
    {
        Gate::authorize('QC.Samples.Approve Sample');

        if ($sample->qc_status !== 'pending') {
            return redirect()->back()->with('status', 'Sample is not pending QC.');
        }

        $request->validate(['rejection_reason' => 'required|string|max:1000']);

        $sample->load('activeAcceptanceItems');

        foreach ($sample->activeAcceptanceItems as $acceptanceItem) {
            $acceptanceItemService->rejectSample($acceptanceItem, $sample->id);
        }

        $sample->update([
            'qc_status'         => 'rejected',
            'qc_approved_by_id' => auth()->id(),
            'qc_approved_at'    => now(),
            'rejection_reason'  => $request->rejection_reason,
        ]);

        return redirect()->back()->with(['success' => true, 'status' => 'Sample QC rejected.']);
    }
}
