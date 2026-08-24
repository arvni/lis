<?php

declare(strict_types=1);

namespace App\Domains\Reception\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * An acceptance stopped counting — cancelled or deleted — so whatever it consumed
 * from a discount card goes back to the card.
 */
class AcceptanceCardReleasedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $acceptanceId, public string $reason) {}
}
