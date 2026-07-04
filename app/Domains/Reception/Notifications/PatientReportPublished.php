<?php

namespace App\Domains\Reception\Notifications;

use App\Domains\Reception\Models\Acceptance;
use App\Notifications\Channels\OmantelIsmartSmsChannel;
use App\Notifications\Channels\TwilioWhatsAppTemplateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PatientReportPublished extends Notification implements ShouldQueue
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
        $via = [];
        $howReport = $this->acceptance->howReport ?? [];

        if (!empty($howReport['sms'])) {
            $via[] = OmantelIsmartSmsChannel::class;
        }
        if (!empty($howReport['whatsapp'])) {
            $via[] = TwilioWhatsAppTemplateChannel::class;
        }

        return $via;
    }

    /**
     * @return array{0: ?string, 1: string}
     */
    public function toSms(mixed $notifiable): array
    {
        $portalUrl = config('services.patient_portal.url');
        $message = "Hi {$notifiable->fullName}, your medical report is ready. View it here: {$portalUrl}";

        return [$notifiable->phone, $message];
    }

    public function toWhatsAppTemplate(mixed $notifiable): array
    {
        return [
            'name' => config('services.twilio.templates.acceptance_report_published'),
            'to' => $notifiable->phone,
            'parameters' => [
                "1" => $notifiable->fullName,
            ]
        ];
    }
}
