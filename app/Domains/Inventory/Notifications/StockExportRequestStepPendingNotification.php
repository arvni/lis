<?php

declare(strict_types=1);

namespace App\Domains\Inventory\Notifications;

use App\Domains\Inventory\Models\StockExportRequest;
use App\Domains\Inventory\Models\WorkflowStep;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class StockExportRequestStepPendingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly StockExportRequest $request,
        public readonly WorkflowStep $step,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'export_request_step_pending',
            'export_request_id' => $this->request->id,
            'message' => "Export request #{$this->request->id} is waiting for your approval — step: {$this->step->name}",
            'link' => route('inventory.export-requests.show', $this->request->id),
        ];
    }
}
