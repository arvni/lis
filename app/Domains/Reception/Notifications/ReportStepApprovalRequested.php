<?php

namespace App\Domains\Reception\Notifications;

use App\Domains\Laboratory\Models\ApprovalFlowStep;
use App\Domains\Reception\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ReportStepApprovalRequested extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Report           $report,
        public ApprovalFlowStep $step
    )
    {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $this->report->loadMissing("acceptanceItem.patients", "acceptanceItem.test");
        $patientNames = $this->report->acceptanceItem?->patients?->pluck("fullName")->join(", ");
        $testName = $this->report->acceptanceItem?->test?->name;

        return [
            "type" => "report-approval",
            "title" => "Report Waiting for Your Approval",
            "message" => trim("Report #{$this->report->id}"
                . ($testName ? " ($testName)" : "")
                . ($patientNames ? " for $patientNames" : "")
                . " is waiting for the '{$this->step->name}' approval step."),
            "report_id" => $this->report->id,
            "step" => $this->step->name,
            "url" => route("reports.show", $this->report->id),
        ];
    }
}
