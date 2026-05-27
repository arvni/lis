<?php

namespace App\Notifications;

use App\Domains\Reception\Models\Acceptance;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReferrerReportPublished extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Acceptance $acceptance)
    {
        //
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $patientName = $this->acceptance->patient?->fullName ?? 'Patient';
        $providerLink = config('services.provider_app.webhook_domain');

        return (new MailMessage)
            ->subject($patientName)
            ->line("The medical report for {$patientName} is ready.")
            ->action('View Report', $providerLink)
            ->line('Thank you for trusting Bion Genetic Laboratory with your healthcare needs!');
    }
}
