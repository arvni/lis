<?php

namespace App\Domains\Reception\Services;

use App\Domains\Laboratory\Models\ApprovalFlowStep;
use App\Domains\Reception\Enums\ReportApprovalAction;
use App\Domains\Reception\Enums\ReportApprovalStatus;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Notifications\ReportRejected;
use App\Domains\Reception\Notifications\ReportStepApprovalRequested;
use App\Domains\Reception\Repositories\ReportApprovalRepository;
use App\Domains\Reception\Repositories\ReportRepository;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;

class ReportApprovalService
{
    public function __construct(
        private readonly ReportService            $reportService,
        private readonly ReportRepository         $reportRepository,
        private readonly ReportApprovalRepository $reportApprovalRepository,
        private readonly AcceptanceItemService    $acceptanceItemService,
    )
    {
    }

    /**
     * Record an approval on the report's current step.
     *
     * Intermediate steps only advance the flow; the final step (or a report
     * without a flow) runs the full legacy approval: published PDF, approver
     * signer, approver_id/approved_at and timeline entry.
     *
     * @param Report $report
     * @param User $approver
     * @param array|null $publishedReportDocument required on the final step
     * @param array|null $clinicalCommentDocument
     * @param string|null $comment
     * @return Report
     */
    public function approve(
        Report  $report,
        User    $approver,
        ?array  $publishedReportDocument = null,
        ?array  $clinicalCommentDocument = null,
        ?string $comment = null
    ): Report
    {
        $step = $report->currentApprovalStep();

        $this->reportApprovalRepository->create([
            "report_id" => $report->id,
            "approval_flow_step_id" => $step?->id,
            "user_id" => $approver->id,
            "action" => ReportApprovalAction::APPROVED,
            "comment" => $comment,
        ]);

        $nextStep = $step ? $report->approvalFlow()->stepAfter($step->position) : null;

        if ($nextStep) {
            $report = $this->reportRepository->update($report, [
                "approval_status" => ReportApprovalStatus::IN_APPROVAL,
                "current_step_position" => $nextStep->position,
            ]);

            $report->loadMissing("acceptanceItem");
            $this->acceptanceItemService->updateAcceptanceItemTimeline(
                $report->acceptanceItem,
                "Report Step '$step->name' Approved By $approver->name"
            );

            $this->notifyNextStepApprovers($report, $nextStep);

            return $report;
        }

        $report = $this->reportService->approveReport(
            $report,
            $approver,
            $publishedReportDocument,
            $clinicalCommentDocument
        );

        return $this->reportRepository->update($report, [
            "approval_status" => ReportApprovalStatus::APPROVED,
            "current_step_position" => null,
        ]);
    }

    /**
     * Reject the report at its current step, ending the flow.
     *
     * @param Report $report
     * @param User $rejecter
     * @param string $comment
     * @return Report
     */
    public function reject(Report $report, User $rejecter, string $comment): Report
    {
        $step = $report->currentApprovalStep();

        $this->reportApprovalRepository->create([
            "report_id" => $report->id,
            "approval_flow_step_id" => $step?->id,
            "user_id" => $rejecter->id,
            "action" => ReportApprovalAction::REJECTED,
            "comment" => $comment,
        ]);

        $report = $this->reportService->rejectReport($report, $rejecter, $comment);

        $report = $this->reportRepository->update($report, [
            "approval_status" => ReportApprovalStatus::REJECTED,
            "current_step_position" => null,
        ]);

        $report->loadMissing("reporter");
        if ($report->reporter && $report->reporter->id !== $rejecter->id) {
            $report->reporter->notify(new ReportRejected($report, $rejecter, $comment));
        }

        return $report;
    }

    /**
     * Notify everyone who may act on the step the report just advanced to.
     * The policy is the source of truth for eligibility, so users blocked by
     * it (the reporter, previous-step approvers) are filtered out here too.
     */
    private function notifyNextStepApprovers(Report $report, ApprovalFlowStep $nextStep): void
    {
        $recipients = $nextStep->eligibleUsers()
            ->filter(fn(User $user) => Gate::forUser($user)->allows("approve", $report));

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new ReportStepApprovalRequested($report, $nextStep));
        }
    }
}
