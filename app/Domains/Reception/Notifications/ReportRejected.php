<?php

namespace App\Domains\Reception\Notifications;

use App\Domains\Reception\Models\Report;
use App\Domains\User\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ReportRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Report $report,
        public User   $rejecter,
        public string $comment
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
            "type" => "report-rejected",
            "title" => "Report Rejected",
            "message" => trim("Your report #{$this->report->id}"
                . ($testName ? " ($testName)" : "")
                . ($patientNames ? " for $patientNames" : "")
                . " was rejected by {$this->rejecter->name}: $this->comment"),
            "report_id" => $this->report->id,
            "url" => route("reports.show", $this->report->id),
        ];
    }
}
