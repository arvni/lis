<?php

namespace App\Domains\Reception\Listeners;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Reception\Services\AcceptanceItemStateService;
use App\Domains\Reception\Services\AcceptanceService;

readonly class SampleCollectedListener
{
    public function __construct(
        private AcceptanceService          $acceptanceService,
        private AcceptanceItemService      $acceptanceItemService,
        private AcceptanceItemStateService $acceptanceItemStateService,
    ) {}

    public function handle(object $event): void
    {
        $barcode        = $event->barcode;
        $user           = auth()->user();
        $acceptanceItem = $this->acceptanceItemService->findAcceptanceItemById($event->acceptanceItemId);
        $sample         = Sample::find($event->sampleId);

        $this->acceptanceItemService->updateAcceptanceItemTimeline(
            $acceptanceItem,
            "Sample Collected By $user->name with Barcode $barcode"
        );

        $acceptance = $this->acceptanceService->getAcceptanceById($acceptanceItem->acceptance_id);

        // Pooling bypasses the QC gate (its own flow)
        if ($acceptance->waiting_for_pooling) {
            $this->acceptanceService->updateAcceptanceStatus($acceptance, AcceptanceStatus::POOLING);
            $this->acceptanceItemStateService->createFirstStateForAcceptanceItem($acceptanceItem, $event->sampleId);
            return;
        }

        // Check if the sampler is trusted for auto-QC approval
        $sampler     = $sample?->sampler ?? $user;
        $autoApprove = (bool) ($sampler?->qc_auto_approve ?? false);

        if ($autoApprove) {
            // Auto-approve: stamp the sample and proceed immediately
            $sample?->update([
                'qc_status'        => 'approved',
                'qc_approved_by_id'=> $sampler->id,
                'qc_approved_at'   => now(),
            ]);
            $this->acceptanceService->updateAcceptanceStatus($acceptance, AcceptanceStatus::WAITING_FOR_ENTERING);
            $this->acceptanceItemStateService->createFirstStateForAcceptanceItem($acceptanceItem, $event->sampleId);
        } else {
            // Gate: mark as pending QC, leave acceptance in current status
            $sample?->update(['qc_status' => 'pending']);
        }
    }
}
