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
            $whatsappMessage = $this->saveWhatsAppMessage($notifiable);
            // Send the template message using Twilio's Content API
            $message = $this->twilio->messages->create($to, [
                'from' => $from,
                'contentSid' => $template['name'],
                'contentVariables' => json_encode($template['parameters']),
                "messagingServiceSid" => $this->messagingServiceSid,
                "statusCallback" => config("CALL_BACK_SERVER" . "/api/whatsapp-message/callback")
            ]);


            $this->updateWhatsAppMessage($whatsappMessage, $message);
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
     * @return WhatsappMessage
     */
    protected function saveWhatsAppMessage($notifiable): WhatsappMessage
    {
        $whatsappMessage = new WhatsappMessage(
            [
                "data" => [],
                "status" => "initial",
            ]
        );
        $whatsappMessage->messageable()->associate($notifiable);
        $whatsappMessage->save();
        return $whatsappMessage;
    }

    /**
     * @param WhatsappMessage $whatsappMessage
     * @param MessageInstance $message
     * @return void
     */
    protected function updateWhatsAppMessage(WhatsappMessage $whatsappMessage, MessageInstance $message): void
    {
        $body = $this->fetchMessageBody($message->sid);
        $data = $message->toArray();
        $data["body"] = $body;
        $whatsappMessage->fill(
            [
                "data" => $data,
                "status" => $message->status,
            ]
        );
        $whatsappMessage->save();
    }

    /**
     * Fetch message body from Twilio API
     *
     * @param string $messageSid
     * @return string|null
     */
    public function fetchMessageBody(string $messageSid): ?string
    {
        try {
            $message = $this->twilio->messages($messageSid)->fetch();
            return $message->body;
        } catch (Exception $e) {
            Log::error('Failed to fetch message body from Twilio: ' . $e->getMessage(), [
                'messageSid' => $messageSid
            ]);
            return null;
        }
    }

    /**
     * Get full message details from Twilio
     *
     * @param string $messageSid
     * @return array|null
     */
    public function fetchFullMessageDetails(string $messageSid): ?array
    {
        try {
            $message = $this->twilio->messages($messageSid)->fetch();
            return [
                'sid' => $message->sid,
                'body' => $message->body,
                'status' => $message->status,
                'direction' => $message->direction,
                'from' => $message->from,
                'to' => $message->to,
                'dateCreated' => $message->dateCreated,
                'dateSent' => $message->dateSent,
                'dateUpdated' => $message->dateUpdated,
                'price' => $message->price,
                'priceUnit' => $message->priceUnit,
                'errorCode' => $message->errorCode,
                'errorMessage' => $message->errorMessage,
            ];
        } catch (Exception $e) {
            Log::error('Failed to fetch message details from Twilio: ' . $e->getMessage(), [
                'messageSid' => $messageSid
            ]);
            return null;
        }
    }

}
