<?php

namespace App\Notifications\Channels;

use App\Domains\Notification\Models\WhatsappMessage;
use Exception;
use Illuminate\Notifications\Notification;
use Twilio\Rest\Api\V2010\Account\MessageInstance;
use Twilio\Rest\Client as TwilioClient;
use Illuminate\Support\Facades\Log;

class TwilioWhatsAppTemplateChannel
{
    /**
     * The Twilio client instance.
     *
     * @var TwilioClient
     */
    protected TwilioClient $twilio;

    /**
     * The phone number notifications should be sent from.
     *
     * @var string
     */
    protected string $from;
    protected string $messagingServiceSid;

    /**
     * Create a new Twilio WhatsApp channel instance.
     *
     * @param TwilioClient $twilio
     * @param string $from
     * @return void
     */
    public function __construct(TwilioClient $twilio, $from, $messagingServiceSid)
    {
        $this->twilio = $twilio;
        $this->from = $from;
        $this->messagingServiceSid = $messagingServiceSid;
    }

    /**
     * Send the given notification.
     *
     * @param mixed $notifiable
     * @param Notification $notification
     * @return MessageInstance|void|null
     */
    public function send($notifiable, Notification $notification)
    {

        $template = $notification->toWhatsAppTemplate($notifiable);

        if (empty($template['name'])) {
            Log::error('WhatsApp template name is required');
            return;
        }

        // Format the WhatsApp number for Twilio
        $to = 'whatsapp:' . $this->formatNumber($template['to']);
        $from = 'whatsapp:' . $this->formatNumber($this->from);

        try {

            // Send the template message using Twilio's Content API
            $message = $this->twilio->messages->create($to, [
                'from' => $from,
                'contentSid' => $template['name'],
                'contentVariables' => json_encode($template['parameters']),
                "messagingServiceSid" => $this->messagingServiceSid
            ]);
            $this->saveWhatsAppMessage($notifiable, $message);
            return $message;
        } catch (Exception $e) {
            Log::error('Twilio WhatsApp API error: ' . $e->getMessage(), [
                'notifiable' => get_class($notifiable),
                'notification' => get_class($notification),
                'to' => $to,
                'template' => $template['name'],
                'contentVariables' => json_encode($template['parameters']),
                "messagingServiceSid" => $this->messagingServiceSid
            ]);
        }
    }

    /**
     * Format the phone number.
     *
     * @param string $number
     * @return string
     */
    protected function formatNumber($number): string
    {
        // Remove any non-numeric characters
        $number = preg_replace('/[^0-9]/', '', $number);

        // Ensure it has international format
        if (!str_starts_with($number, '+')) {
            $number = '+' . $number;
        }

        return $number;
    }

    /**
     * @param $notifiable
     * @param MessageInstance $message
     * @return void
     */
    protected function saveWhatsAppMessage($notifiable, MessageInstance $message): void
    {
        $whatsappMessage = new WhatsappMessage(
            [
                "data" => $message->toArray(),
                "status" => $message->status,
            ]
        );
        $whatsappMessage->messageable()->associate($notifiable);
        $whatsappMessage->save();
    }
}
