<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Notifications;

use App\Domains\Inventory\Models\StockExportRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class StockExportRequestApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly StockExportRequest $request) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'export_request_approved',
            'export_request_id' => $this->request->id,
            'message' => "Your stock export request #{$this->request->id} has been approved.",
            'link' => route('inventory.export-requests.show', $this->request->id),
        ];
    }
}
