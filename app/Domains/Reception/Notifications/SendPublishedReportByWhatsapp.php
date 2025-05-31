<?php

namespace App\Domains\Reception\Notifications;

use App\Domains\Reception\Models\Acceptance;
use App\Notifications\Channels\TwilioWhatsAppTemplateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SendPublishedReportByWhatsapp extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $title, public string $documentId, public string $whatsappNumber)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $via[] = TwilioWhatsAppTemplateChannel::class;
        return $via;
    }

    /**
     * Get the WhatsApp template representation of the notification.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function toWhatsAppTemplate($notifiable): array
    {
        // The template name should be the Content SID from your Twilio Console
        // Example: HXabcdef1234567890abcdef1234567890

        return [
            'name' => config('services.twilio.templates.send_report_file'),
            'to' => $this->whatsappNumber,
            'parameters' => [
                "1" => $this->title, // {{1}} - Customer name
                "2" => "0000bda7-f4ee-4279-ad07-0ec81a3bed34"//$this->documentId, // {{2}} - Customer name
            ]
        ];
    }
}
