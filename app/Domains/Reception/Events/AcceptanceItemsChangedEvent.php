<?php

declare(strict_types=1);

namespace App\Domains\Reception\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * An acceptance's item set or pricing moved. Anything derived from the items —
 * today the partner card discounts — recalculates off this rather than each
 * caller remembering to.
 */
class AcceptanceItemsChangedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $acceptanceId) {}
}
