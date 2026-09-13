<?php

declare(strict_types=1);

namespace App\Domains\Reception\Notifications;

use App\Domains\Reception\DTOs\TatAlertDTO;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class TatDeadlineApproaching extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public TatAlertDTO $alert) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $alert = $this->alert;
        $acceptance = '#'.($alert->referenceCode ?? $alert->acceptanceId)
            .($alert->patientName ? " ({$alert->patientName})" : '');

        return [
            'type' => 'tat-alert',
            'title' => $this->title(),
            'message' => "Acceptance {$acceptance}: ".implode(', ', $alert->testNames)
                ." due {$alert->deadline} · rule: {$alert->ruleName}",
            'acceptance_id' => $alert->acceptanceId,
            'days_left' => $alert->daysLeft,
            'deadline' => $alert->deadline,
            'url' => route('acceptances.show', $alert->acceptanceId),
        ];
    }

    public function title(): string
    {
        $days = $this->alert->daysLeft;

        return match (true) {
            $days < 0 => 'TAT overdue by '.abs($days).' working '.Str::plural('day', abs($days)),
            $days === 0 => 'TAT due today',
            default => "TAT alert: {$days} working ".Str::plural('day', $days).' left',
        };
    }
}
