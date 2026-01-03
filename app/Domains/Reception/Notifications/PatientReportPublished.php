<?php

namespace App\Domains\Reception\Notifications;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\Acceptance;
use App\Notifications\Channels\TwilioWhatsAppTemplateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PatientReportPublished extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Acceptance $acceptance)
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
        $via = [];

        // Check if howReport exists and has the required keys
        $howReport = $this->acceptance->howReport ?? [];

        if (!empty($howReport['whatsapp'])) {
            $via[] = TwilioWhatsAppTemplateChannel::class;
        }

        if (!empty($howReport['email'])) {
            $via[] = 'mail';
        }

        return $via;
    }

    /**
     * Get the mail recipient for this notification
     */
    public function routeNotificationForMail($notifiable)
    {
        $howReport = $this->acceptance->howReport ?? [];
        return $howReport['emailAddress'] ?? $notifiable->email ?? null;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // Get email address - first check if notifiable has a custom route method
        $emailAddress = method_exists($notifiable, 'routeNotificationForMail')
            ? $notifiable->routeNotificationForMail()
            : ($notifiable->email ?? null);

        // Fallback to acceptance howReport if needed
        if (!$emailAddress) {
            $howReport = $this->acceptance->howReport ?? [];
            $emailAddress = $howReport['emailAddress'] ?? null;
        }

        $message = (new MailMessage)
            ->subject('Your Medical Report is Ready')
            ->line('We are pleased to inform you that your medical report has been published and is now ready for review.')
            ->line('Thank you for trusting Bion Genetic Laboratory with your healthcare needs!');

        // Load acceptance with related data
        $acceptance = $this->acceptance->load([
            "acceptanceItems" => function ($query) {
                $query->where("reportless", false);
                $query->with("report.publishedDocument");
            }
        ]);

        // Attach report files
        foreach ($acceptance->acceptanceItems as $acceptanceItem) {
            try {
                // Check if report and publishedDocument exist
                if (!$acceptanceItem->report || !$acceptanceItem->report->publishedDocument) {
                    Log::warning("Missing report or published document for acceptance item ID: {$acceptanceItem->id}");
                    continue;
                }

                $document = $acceptanceItem->report->publishedDocument;
                $filePath = $document->path;

                // Check if file exists before attaching
                if ($this->fileExists($filePath)) {
                    $fileName = $this->generateFileName($document, $acceptanceItem);

                    $message->attach($filePath, [
                        'as' => $fileName,
                        'mime' => $document->ext ?? 'application/pdf',
                    ]);
                } else {
                    Log::error("Report file not found: {$filePath}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to attach report file for acceptance item {$acceptanceItem->id}: " . $e->getMessage());
            }
        }

        return $message;
    }

    /**
     * Check if file exists (handles both storage and absolute paths)
     */
    private function fileExists(string $path): bool
    {
        // If it's an absolute path, check directly
        if (file_exists($path)) {
            return true;
        }

        // If it's a relative path, check in storage
        if (Storage::exists($path)) {
            return true;
        }

        // Check in storage/app directory
        if (file_exists(storage_path('app/' . $path))) {
            return true;
        }

        return false;
    }

    /**
     * Generate a meaningful filename for the attachment
     */
    private function generateFileName($document, $acceptanceItem): string
    {
        $fileName = $document->original_name ?? $document->name ?? 'report';

        // If filename doesn't have extension, add it based on mime type
        if (!pathinfo($fileName, PATHINFO_EXTENSION)) {
            $extension = $document->ext;
            $fileName .= '.' . $extension;
        }

        // Add acceptance item info to make filename unique
        $prefix = "Report_{$this->acceptance->id}_{$acceptanceItem->id}_";

        return $prefix . $fileName;
    }

    /**
     * Get the SMS representation of the notification.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function toSms($notifiable): array
    {
        $message = "Hi {$notifiable->fullName}!\n
        Your medical report is ready.\n
        Thank you for trusting Bion Genetic Laboratory!";

        return [$notifiable->phone, $message];
    }

    /**
     * Get the WhatsApp template representation of the notification.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function toWhatsAppTemplate($notifiable): array
    {
        $howReport = $this->acceptance->howReport ?? [];
        $whatsappNumber = $howReport['whatsappNumber'] ?? $notifiable->phone ?? null;

        return [
            'name' => config('services.twilio.templates.acceptance_report_published'),
            'to' => $whatsappNumber,
            'parameters' => [
                "1" => $notifiable->fullName, // {{1}} - Patient name
            ]
        ];
    }
}
