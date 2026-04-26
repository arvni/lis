<?php

namespace App\Http\Controllers\QC;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Services\AcceptanceItemStateService;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ApproveSampleQCController extends Controller
{
    public function __construct(
        private readonly AcceptanceItemStateService $stateService,
        private readonly AcceptanceService          $acceptanceService,
    ) {}

    public function __invoke(Request $request, Sample $sample)
    {
        Gate::authorize('QC.Samples.Approve Sample');

        if ($sample->qc_status !== 'pending') {
            return redirect()->back()->with('status', 'Sample is not pending QC.');
        }

        $sample->update([
            'qc_status'         => 'approved',
            'qc_approved_by_id' => auth()->id(),
            'qc_approved_at'    => now(),
        ]);

        // Create first AcceptanceItemState for each active acceptance item
        $acceptanceIds = [];
        foreach ($sample->activeAcceptanceItems as $item) {
            $this->stateService->createFirstStateForAcceptanceItem($item, $sample->id);
            $acceptanceIds[] = $item->acceptance_id;
        }

        // Move each linked acceptance to WAITING_FOR_ENTERING
        foreach (array_unique($acceptanceIds) as $acceptanceId) {
            $acceptance = $this->acceptanceService->getAcceptanceById($acceptanceId);
            if ($acceptance && $acceptance->status !== AcceptanceStatus::REPORTED) {
                $this->acceptanceService->updateAcceptanceStatus(
                    $acceptance,
                    AcceptanceStatus::WAITING_FOR_ENTERING
                );
            }
        }

        return redirect()->back()->with(['success' => true, 'status' => 'Sample QC approved.']);
    }
}
