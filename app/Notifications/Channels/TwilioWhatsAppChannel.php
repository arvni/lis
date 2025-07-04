<?php

namespace App\Notifications\Channels;

use App\Domains\Notification\Models\WhatsappMessage;
use Exception;
use Illuminate\Notifications\Notification;
use Twilio\Rest\Api\V2010\Account\MessageInstance;
use Twilio\Rest\Client as TwilioClient;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TwilioWhatsAppChannel
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
     * @param $messagingServiceSid
     */
    public function __construct(TwilioClient $twilio, string $from, $messagingServiceSid)
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
        // Check if notification supports WhatsApp message
        if (!method_exists($notification, 'toWhatsApp')) {
            Log::error('Notification must implement toWhatsApp method');
            return null;
        }

        return $this->sendMessage($notifiable, $notification);
    }

    /**
     * Send regular message with text and/or media
     *
     * @param mixed $notifiable
     * @param Notification $notification
     * @return MessageInstance|void|null
     */
    protected function sendMessage($notifiable, Notification $notification)
    {
        $message = $notification->toWhatsApp($notifiable);

        if (empty($message['to'])) {
            Log::error('WhatsApp recipient number is required');
            return;
        }

        // Format the WhatsApp number for Twilio
        $to = 'whatsapp:' . $this->formatNumber($message['to']);
        $from = 'whatsapp:' . $this->formatNumber($this->from);

        try {
            $whatsappMessage = $this->saveWhatsAppMessage($notifiable);

            $messageData = [
                'from' => $from,
                'messagingServiceSid' => $this->messagingServiceSid,
                'statusCallback' => config("services.whatsapp.callback-server") .config("services.whatsapp.callback-url")
            ];

            // Add body text if provided
            if (!empty($message['body'])) {
                $messageData['body'] = $message['body'];
            }

            // Handle media attachment (PDF or other files)
            if (!empty($message['media'])) {
                $mediaUrl = $this->handleMediaAttachment($message['media']);
                if ($mediaUrl) {
                    $messageData['mediaUrl'] = $mediaUrl;

                    // Add filename if provided
                    if (!empty($message['filename'])) {
                        $messageData['body'] = ($messageData['body'] ?? '') . "\n📎 " . $message['filename'];
                    }
                }
            }

            // Send the message
            $twilioMessage = $this->twilio->messages->create($to, $messageData);

            $this->updateWhatsAppMessage($whatsappMessage, $twilioMessage);
            return $twilioMessage;

        } catch (Exception $e) {
            Log::error('Twilio WhatsApp message API error: ' . $e->getMessage(), [
                'notifiable' => get_class($notifiable),
                'notification' => get_class($notification),
                'to' => $to,
                'message' => $message,
                'messagingServiceSid' => $this->messagingServiceSid
            ]);
        }
    }

    /**
     * Handle media attachment - convert local file to publicly accessible URL
     *
     * @param string $mediaPath
     * @return string|null
     */
    protected function handleMediaAttachment($mediaPath): ?string
    {
        try {
            // If it's already a URL, return as is
            if (filter_var($mediaPath, FILTER_VALIDATE_URL)) {
                return $mediaPath;
            }

            // If it's a local file path, we need to make it publicly accessible
            if (Storage::exists($mediaPath)) {
                // Generate a temporary public URL (if using cloud storage like S3)
                if (config('filesystems.default') === 's3') {
                    return Storage::temporaryUrl($mediaPath, now()->addHours(24));
                }

                // For local storage, you'll need to copy to public directory or use a controller route
                return $this->createPublicMediaUrl($mediaPath);
            }

            Log::error('Media file not found: ' . $mediaPath);
            return null;

        } catch (Exception $e) {
            Log::error('Error handling media attachment: ' . $e->getMessage(), [
                'mediaPath' => $mediaPath
            ]);
            return null;
        }
    }

    /**
     * Create publicly accessible URL for local media files
     *
     * @param string $mediaPath
     * @return string
     */
    protected function createPublicMediaUrl($mediaPath): string
    {
        // Option 1: Copy to public directory
        $publicPath = 'temp-media/' . basename($mediaPath);
        $fullPublicPath = public_path($publicPath);

        // Ensure directory exists
        if (!file_exists(dirname($fullPublicPath))) {
            mkdir(dirname($fullPublicPath), 0755, true);
        }

        // Copy file to public directory
        copy(Storage::path($mediaPath), $fullPublicPath);

        // Return public URL
        return url($publicPath);

        // Option 2: Use a controller route to serve the file
        // return route('serve.media', ['file' => encrypt($mediaPath)]);
    }

    /**
     * Format the phone number.
     *
     * @param string $number
     * @return string
     */
    protected function formatNumber($number): string
    {
        // Remove any non-numeric characters except +
        $number = preg_replace('/[^0-9+]/', '', $number);

        // Ensure it has international format
        if (!str_starts_with($number, '+')) {
            $number = '+' . $number;
        }

        return $number;
    }

    /**
     * @param $notifiable
     * @return WhatsappMessage
     */
    protected function saveWhatsAppMessage($notifiable): WhatsappMessage
    {
        $whatsappMessage = new WhatsappMessage([
            "data" => [],
            "status" => "initial",
        ]);
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
        $whatsappMessage->fill([
            "data" => $data,
            "status" => $message->status,
        ]);
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
