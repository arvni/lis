<?php

declare(strict_types=1);

namespace App\Domains\Reception\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * The mirror of AcceptanceDeletedEvent: an acceptance came back, so the invoice
 * that was cancelled with it has to be taken off cancelled again.
 */
class AcceptanceRestoredEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $invoiceId)
    {
    }
}
