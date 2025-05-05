<?php

namespace App\Notifications\Channels;

use Exception;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OmantelIsmartSmsChannel
{
    /**
     * The Omantel iSmart API URL.
     *
     * @var string
     */
    protected $apiUrl;

    /**
     * The Omantel iSmart API username.
     *
     * @var string
     */
    protected $username;

    /**
     * The Omantel iSmart API password.
     *
     * @var string
     */
    protected $password;

    /**
     * The sender ID for SMS messages.
     *
     * @var string
     */
    protected $senderId;

    /**
     * Create a new Omantel iSmart SMS channel instance.
     *
     * @param string $apiUrl
     * @param string $username
     * @param string $password
     * @param string $senderId
     * @return void
     */
    public function __construct(string $apiUrl, string $username, string $password, string $senderId)
    {
        $this->apiUrl = $apiUrl;
        $this->username = $username;
        $this->password = $password;
        $this->senderId = $senderId;
    }

    /**
     * Send the given notification.
     *
     * @param mixed $notifiable
     * @param Notification $notification
     * @return mixed
     */
    public function send($notifiable, Notification $notification)
    {
        list($to, $message) = $notification->toSms($notifiable);
        // Get the recipient's phone number
        if (!$to) {
            Log::error('No SMS recipient phone number provided');
            return;
        }

        // Format the phone number (remove any non-numeric characters)
        $to = preg_replace('/[^0-9]/', '', $to);

        // Ensure phone number has Oman country code (968) if not already
        if (strlen($to) === 8) {
            $to = '968' . $to;
        } elseif (substr($to, 0, 1) === '+') {
            $to = substr($to, 1); // Remove the + sign if present
        }

        if (empty($message)) {
            Log::error('Empty SMS message content');
            return;
        }

        try {
            // Make API request to Omantel iSmart SMS gateway
            $response = Http::get($this->apiUrl, [
                "UserId" => $this->username,
                "Password" => $this->password,
                "MobileNo" => $to,
                "Message" => $message,
                "Lang" => 0,
            ]);

            // Log the response for debugging
            Log::info('Omantel iSmart SMS API response', [
                'response' => $response->body(),
                'status' => $response->status(),
                'to' => $to
            ]);

            // Check if the response is successful based on Omantel iSmart API format
            if (!$response->successful() || !$this->isSuccessResponse($response->body())) {
                Log::error('Omantel iSmart SMS API request failed', [
                    'response' => $response->body(),
                    'status' => $response->status(),
                    'to' => $to
                ]);
            }

            return $response;
        } catch (Exception $e) {
            Log::error('Error sending SMS via Omantel iSmart: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'to' => $to
            ]);
        }
    }

    /**
     * Check if the response indicates success based on Omantel iSmart API format.
     *
     * Note: You may need to adjust this method based on the actual success response format
     * from Omantel iSmart API.
     *
     * @param string $responseBody
     * @return bool
     */
    protected function isSuccessResponse($responseBody)
    {
        // This is a placeholder implementation. Adjust based on actual Omantel iSmart API response format.
        // Typically, SMS gateway APIs return a success code or status that indicates successful delivery.
        return strpos($responseBody, 'success') !== false ||
            strpos($responseBody, 'OK') !== false ||
            strpos($responseBody, 'ACCEPTED') !== false;
    }
}
