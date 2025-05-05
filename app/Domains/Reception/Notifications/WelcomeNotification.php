<?php

namespace App\Domains\Reception\Notifications;

use App\Domains\Reception\Models\Acceptance;
use App\Notifications\Channels\OmantelIsmartSmsChannel;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\TwilioWhatsAppTemplateChannel;

class WelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */

    public Acceptance $acceptance;
    public string $reportDate;

    public function __construct(Acceptance $acceptance, string $reportDate)
    {
        $this->acceptance = $acceptance;
        $this->reportDate = $reportDate;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $via = ['database', OmantelIsmartSmsChannel::class];

        if (isset($this->acceptance->howReport["whatsapp"]) && $this->acceptance->howReport["whatsapp"])
            $via[] = TwilioWhatsAppTemplateChannel::class;
        if (isset($this->acceptance->howReport["email"]) && $this->acceptance->howReport["email"])
            $via[] = 'mail';
        return $via;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Your Request is Being Processed')
            ->greeting('Hello ' . $notifiable->fullName . '!')
            ->line('Great news! We have started processing your request.')
            ->line('Our team is working on it, and you will be notified once it\'s completed.')
            ->line('If you have any questions in the meantime, please don\'t hesitate to contact us.')
            ->action('Check Status', url('/dashboard'))
            ->line('Thank you for your patience!');
        $message->to($this->acceptance->howReport["emailAddress"]);
        return $message;
    }

    /**
     * Get the SMS representation of the notification.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function toSms($notifiable): array
    {
        $date=$this->getEstimatedCompletionDateAttribute()->format("d/m/Y");
        // SMS content should be concise due to character limitations
        return [$notifiable->phone, "Welcome, $notifiable->fullName!\n
         We’re glad to have you with us.\n
         Your report will be ready on $date .\n
         Thank you for trusting Bion Genetic Laboratory!"];
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
            'name' => config('services.twilio.templates.welcome_message'),
            'to' => $this->acceptance->howReport["whatsappNumber"],
            'parameters' => [
                "1" => $notifiable->fullName,                      // {{1}} - Customer name
                "2" => $this->getEstimatedCompletionDateAttribute()->format("d/m/Y")// {{2}} -
            ]
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Processing Started',
            'message' => 'Your request is now being processed.',
            'model_id' => $this->acceptance->id,
        ];
    }

    public function getEstimatedCompletionDateAttribute()
    {
        // Get the report_date (turnaround time in days)
        $turnaroundDays = $this->reportDate;

        if ($turnaroundDays === null) {
            return null;
        }

        // Start with the created_at date
        $startDate = Carbon::parse($this->acceptance->created_at);
        $endDate = $startDate->clone();

        // Counter for business days
        $businessDaysAdded = 0;

        // Loop until we've added enough business days
        while ($businessDaysAdded < $turnaroundDays) {
            // Add one day
            $endDate->addDay();

            // Skip weekends (Saturday = 6, Friday = 0)
            $dayOfWeek = $endDate->dayOfWeek;
            if ($dayOfWeek != 5 && $dayOfWeek != 6) {
                $businessDaysAdded++;
            }

        }

        return $endDate;
    }

}
