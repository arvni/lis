<?php

namespace App\Notifications;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\Acceptance;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ReferrerReportPublished extends Notification
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
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Your Medical Report is Ready')
            ->line('We are pleased to inform you that your medical report has been published and is now ready for review.')
            ->line('Thank you for trusting Bion Genetic Laboratory with your healthcare needs!');

        // Load acceptance with related data
        $acceptance = $this->acceptance->load([
            "acceptanceItems" => function ($query) {
                $query->whereDoesntHave("test", function ($testQuery) {
                    $testQuery->where("type", TestType::SERVICE);
                });
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

                // Get the actual file path and check if it exists
                $actualFilePath = $this->getActualFilePath($filePath);
                if ($actualFilePath) {
                    $fileName = $this->generateFileName($document, $acceptanceItem);
                    $mimeType = $this->getMimeType($document);

                    $message->attach($actualFilePath, [
                        'as' => $fileName,
                        'mime' => $mimeType,
                    ]);
                } else {
                    Log::error("Report file not found: {$filePath}");
                }
            } catch (Exception $e) {
                Log::error("Failed to attach report file for acceptance item {$acceptanceItem->id}: " . $e->getMessage());
            }
        }

        return $message;
    }

    /**
     * Get the actual file path that exists
     */
    private function getActualFilePath(string $path): ?string
    {
        // If it's an absolute path and exists, return it
        if (file_exists($path)) {
            return $path;
        }

        // If it exists in storage, return the full path
        if (Storage::exists($path)) {
            return Storage::path($path);
        }

        // Check in storage/app directory
        $storagePath = storage_path('app/' . $path);
        if (file_exists($storagePath)) {
            return $storagePath;
        }

        return null;
    }

    /**
     * Get proper MIME type from document
     */
    private function getMimeType($document): string
    {
        // If document already has a proper MIME type
        if (isset($document->mime_type) && str_contains($document->mime_type, '/')) {
            return $document->mime_type;
        }

        // Convert file extension to MIME type
        $extension = $document->ext ?? pathinfo($document->path ?? '', PATHINFO_EXTENSION);

        return match(strtolower($extension)) {
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'txt' => 'text/plain',
            'html' => 'text/html',
            'zip' => 'application/zip',
            default => 'application/octet-stream'
        };
    }

    /**
     * Generate a meaningful filename for the attachment
     */
    private function generateFileName($document, $acceptanceItem): string
    {
        $fileName = $document->original_name ?? $document->name ?? 'report';

        // If filename doesn't have extension, add it based on extension
        if (!pathinfo($fileName, PATHINFO_EXTENSION)) {
            $extension = $document->ext ?? 'pdf';
            $fileName .= '.' . strtolower($extension);
        }

        // Add acceptance item info to make filename unique
        $prefix = "Report_{$this->acceptance->id}_{$acceptanceItem->id}_";

        return $prefix . $fileName;
    }
}
